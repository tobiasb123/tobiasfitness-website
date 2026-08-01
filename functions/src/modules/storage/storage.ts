import {
  CreateUploadIntentInput,
  CreateUploadIntentReturn,
  DocumentFile,
  FileType,
  FinalizeUploadInput,
} from '@models/storage';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getDownloadURL, getStorage } from 'firebase-admin/storage';
import { HttpsError } from 'firebase-functions/https';
import moment from 'moment-timezone';
import { createAdminEndpoint, createAuthEndpoint, createPublicEndpoint } from '../../shared/http';
import { getUser } from '../auth/common/auth.common';
import { commonGetFileNameFromPath, commonGetFileTypePath } from './common/storage-path.common';
import { commonNormalizeFileName, commonValidateIntentContentType } from './common/storage.common';
import { UploadIntentDocument } from './interfaces/upload-intent-document.interface';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const UPLOAD_INTENT_EXPIRY_MINUTES = 15;

const firestore = getFirestore();
const recipeCollection = firestore.collection('recipes');
const reviewCollection = firestore.collection('reviews');
const storage = getStorage();
const bucket = storage.bucket();
const uploadIntentCollection = firestore.collection('storage-upload-intents');

export const createUploadIntent = createAuthEndpoint(async (req, res, user) => {
  const input = req.body as CreateUploadIntentInput;
  const userProfile = await getUser(user.uid);

  if (input.fileType === 'recipe' && !userProfile.admin) {
    throw new HttpsError('permission-denied', 'Du kan ikke tilføje opskrifter');
  }

  const normalizedFileName = commonNormalizeFileName(input.fileName);
  const normalizedContentType = commonValidateIntentContentType(input.contentType);

  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    throw new HttpsError('invalid-argument', 'Filstørrelse er ugyldig');
  }

  if (input.sizeBytes > MAX_FILE_SIZE) {
    throw new HttpsError('invalid-argument', 'Filen er for stor');
  }

  const uploadIntentRef = uploadIntentCollection.doc();
  const fileRootPath = commonGetFileTypePath(input.fileType);
  const targetFileId = input.fileId?.trim();
  const normalizedRecipeUid = input.uid?.trim();

  if (input.fileType === 'recipe' && normalizedRecipeUid && normalizedRecipeUid !== 'all') {
    await getUser(normalizedRecipeUid).catch(() => {
      throw new HttpsError('invalid-argument', 'Brugeren blev ikke fundet');
    });
  }

  if (input.fileType === 'recipe' && targetFileId) {
    const existingRecipe = await getFileInfoFromFirestoreById(targetFileId, input.fileType);

    if (!existingRecipe) {
      throw new HttpsError('not-found', 'Opskrift blev ikke fundet');
    }
  }

  const storagePath = `${fileRootPath}/pending/${uploadIntentRef.id}/${normalizedFileName}`;
  const expiresAtDate = new Date(Date.now() + UPLOAD_INTENT_EXPIRY_MINUTES * 60 * 1000);

  const uploadIntentData: UploadIntentDocument = {
    uid: user.uid,
    status: 'pending',
    fileName: normalizedFileName,
    fileType: input.fileType,
    folderPath: fileRootPath,
    ...(normalizedContentType ? { contentType: normalizedContentType } : {}),
    sizeBytes: input.sizeBytes,
    maxSizeBytes: MAX_FILE_SIZE,
    storagePath,
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromDate(expiresAtDate),
  };

  if (targetFileId) {
    uploadIntentData.fileId = targetFileId;
  }

  if (normalizedRecipeUid) {
    uploadIntentData.recipeUid = normalizedRecipeUid;
  }

  if (input.recipe) {
    uploadIntentData.recipe = input.recipe;
  }

  if (input.review) {
    uploadIntentData.review = input.review;
  }

  await uploadIntentRef.set(uploadIntentData);

  res.json(<CreateUploadIntentReturn>{
    uploadIntentId: uploadIntentRef.id,
    storagePath,
    maxSizeBytes: MAX_FILE_SIZE,
    expiresAt: expiresAtDate.toISOString(),
  });
});

export const finalizeUpload = createAuthEndpoint(async (req, res, user) => {
  const input = req.body as FinalizeUploadInput;

  if (!input.uploadIntentId) {
    throw new HttpsError('invalid-argument', 'Upload sessionen er ugyldig');
  }

  const uploadIntentRef = uploadIntentCollection.doc(input.uploadIntentId);
  const uploadIntentSnapshot = await uploadIntentRef.get();

  if (!uploadIntentSnapshot.exists) {
    throw new HttpsError('not-found', 'Upload sessionen blev ikke fundet');
  }

  const uploadIntent = uploadIntentSnapshot.data() as UploadIntentDocument;

  if (uploadIntent.uid !== user.uid) {
    throw new HttpsError('permission-denied', 'Du har ikke tilladelse til denne upload session');
  }

  if (uploadIntent.status === 'finalized') {
    const finalizedFile = await getFileInfoFromFirestoreById(
      uploadIntent.finalizedFileId ?? input.uploadIntentId,
      uploadIntent.fileType,
    );

    if (!finalizedFile) {
      throw new HttpsError('not-found', 'Den færdiggjorte fil blev ikke fundet');
    }

    res.json(finalizedFile);
  } else {
    const expiresAtMillis = uploadIntent.expiresAt.toMillis();

    if (Date.now() > expiresAtMillis) {
      throw new HttpsError('deadline-exceeded', 'Upload sessionen er udløbet - start en ny upload');
    }

    const sourceFile = bucket.file(uploadIntent.storagePath);
    const sourceFileExists = await sourceFile.exists();

    if (!sourceFileExists[0]) {
      throw new HttpsError('not-found', 'Den uploadede fil blev ikke fundet');
    }

    const targetFileId = uploadIntent.fileId ?? input.uploadIntentId;
    const existingFile = uploadIntent.fileId
      ? await getFileInfoFromFirestoreById(uploadIntent.fileId, uploadIntent.fileType)
      : null;

    if (uploadIntent.fileId && !existingFile) {
      throw new HttpsError('not-found', 'Opskrift blev ikke fundet');
    }

    const fileRootPath = commonGetFileTypePath(uploadIntent.fileType);
    const canonicalFilePath = `${fileRootPath}/${targetFileId}/${uploadIntent.fileName}`;
    let activeFile = sourceFile;

    if (canonicalFilePath !== uploadIntent.storagePath) {
      const canonicalFile = bucket.file(canonicalFilePath);
      const canonicalFileExists = await canonicalFile.exists();

      if (canonicalFileExists[0] && canonicalFilePath !== existingFile?.filePath) {
        throw new HttpsError('already-exists', 'En fil med dette navn findes allerede');
      }

      if (canonicalFileExists[0] && canonicalFilePath === existingFile?.filePath) {
        await canonicalFile.delete();
      }

      await sourceFile.move(canonicalFilePath);
      activeFile = canonicalFile;
    }

    const storageMetadata = (await activeFile.getMetadata())[0];
    const uploadedSizeBytes = Number(storageMetadata.size || 0);

    if (!Number.isFinite(uploadedSizeBytes) || uploadedSizeBytes <= 0) {
      throw new HttpsError('invalid-argument', 'Den uploadede fil er ugyldig');
    }

    if (uploadedSizeBytes !== uploadIntent.sizeBytes) {
      throw new HttpsError('invalid-argument', 'Filstørrelse stemmer ikke overens');
    }

    if (uploadedSizeBytes > uploadIntent.maxSizeBytes) {
      throw new HttpsError('invalid-argument', 'Filen er for stor');
    }

    const uploadedContentType = storageMetadata.contentType?.toLowerCase();

    if (!uploadedContentType || !uploadedContentType.startsWith('image/')) {
      throw new HttpsError('invalid-argument', 'Filen skal være et billede');
    }

    const fileUrl = await getDownloadURL(activeFile);
    const timeCreated =
      existingFile?.timeCreated ??
      moment(storageMetadata.timeCreated).tz('Europe/Copenhagen').toString();
    const normalizedRecipe = normalizeRecipe(uploadIntent.recipe ?? existingFile?.recipe);
    const normalizedReview = uploadIntent.review ?? existingFile?.review;
    const fileData: Omit<DocumentFile, 'id' | 'fileType' | 'fileName' | 'folderPath'> = {
      filePath: activeFile.name,
      fileUrl,
      uid:
        uploadIntent.fileType === 'recipe'
          ? (uploadIntent.recipeUid ?? existingFile?.uid ?? 'all')
          : (existingFile?.uid ?? user.uid),
      timeCreated,
      ...(normalizedRecipe ? { recipe: normalizedRecipe } : {}),
      ...(normalizedReview ? { review: normalizedReview } : {}),
    };

    const collectionPath = commonGetFileTypePath(uploadIntent.fileType);
    await firestore.collection(collectionPath).doc(targetFileId).set(fileData);

    if (existingFile?.filePath && existingFile.filePath !== activeFile.name) {
      await bucket.file(existingFile.filePath).delete({ ignoreNotFound: true });
    }

    const fileName = commonGetFileNameFromPath(fileData.filePath, uploadIntent.fileType);
    const folderPath = commonGetFileTypePath(uploadIntent.fileType);

    const file: DocumentFile = {
      ...fileData,
      id: targetFileId,
      fileType: uploadIntent.fileType,
      fileName,
      folderPath,
    };

    await uploadIntentRef.set(
      {
        status: 'finalized',
        finalizedAt: Timestamp.now(),
        finalizedFileId: file.id,
        finalStoragePath: file.filePath,
      },
      {
        merge: true,
      },
    );

    res.json(file);
  }
});

export const getRecipes = createAuthEndpoint(async (req, res) => {
  const recipes = await recipeCollection.get().then((recipeSnap) => {
    const recipes: DocumentFile[] = [];

    for (const recipeDoc of recipeSnap.docs) {
      const recipe = recipeDoc.data() as DocumentFile;

      recipes.push({
        ...recipe,
        id: recipeDoc.id,
        recipe: normalizeRecipe(recipe.recipe),
      });
    }

    return recipes;
  });

  res.json(recipes);
});

export const editRecipe = createAdminEndpoint(async (req, res) => {
  const data = req.body as DocumentFile;
  const recipeDoc = await recipeCollection.doc(data.id).get();
  const normalizedRecipeUid = data.uid?.trim();

  if (!normalizedRecipeUid) {
    throw new HttpsError('invalid-argument', 'Modtageren er påkrævet');
  }

  if (normalizedRecipeUid !== 'all') {
    await getUser(normalizedRecipeUid).catch(() => {
      throw new HttpsError('invalid-argument', 'Brugeren blev ikke fundet');
    });
  }

  if (!recipeDoc.exists) {
    throw new HttpsError('not-found', 'Opskrift findes ikke');
  }

  await recipeDoc.ref
    .update({
      uid: normalizedRecipeUid,
      recipe: normalizeRecipe(data.recipe),
    })
    .catch(() => {
      throw new HttpsError('internal', 'Opskrift blev ikke ændret');
    });

  res.json();
});

export const deleteRecipe = createAdminEndpoint(async (req, res) => {
  const requestBody = req.body as unknown;
  const rawId =
    typeof requestBody === 'string'
      ? requestBody
      : typeof requestBody === 'object' && requestBody && 'id' in requestBody
        ? String((requestBody as { id?: unknown }).id ?? '')
        : '';

  const id = rawId.trim();

  if (!id) {
    throw new HttpsError('invalid-argument', 'Opskrift id er påkrævet');
  }

  const recipeDoc = await recipeCollection.doc(id).get();

  if (!recipeDoc.exists) {
    throw new HttpsError('not-found', 'Opskrift findes ikke');
  }

  const recipe = recipeDoc.data() as DocumentFile;
  const filePath = typeof recipe.filePath === 'string' ? recipe.filePath.trim() : '';

  if (filePath) {
    const file = bucket.file(filePath);
    const [fileExists] = await file.exists();

    if (fileExists) {
      await file.delete().catch((error) => {
        console.log('Could not delete file from storage', error);
      });
    }
  }

  await recipeDoc.ref.delete().catch(() => {
    throw new HttpsError('internal', 'Opskrift kunne ikke slettes');
  });

  res.json({ deleted: true, id });
});

export const getReviews = createPublicEndpoint(async (req, res) => {
  const reviews = await reviewCollection.get().then((reviewSnap) => {
    const reviews: DocumentFile[] = [];

    for (const reviewDoc of reviewSnap.docs) {
      const review = reviewDoc.data() as DocumentFile;

      reviews.push({
        ...review,
        id: reviewDoc.id,
      });
    }

    return reviews;
  });

  res.json(reviews);
});

const getFileInfoFromFirestoreById = async (
  fileId: string,
  fileType: FileType,
): Promise<DocumentFile> => {
  const collectionPath = commonGetFileTypePath(fileType);
  const docSnapshot = await firestore.collection(collectionPath).doc(fileId).get();

  if (!docSnapshot.exists) {
    return null;
  }

  const data = docSnapshot.data() as DocumentFile;
  const fileName = commonGetFileNameFromPath(data.filePath, fileType);
  const folderPath = commonGetFileTypePath(fileType);

  return <DocumentFile>{
    ...data,
    id: docSnapshot.id,
    fileType,
    fileName,
    folderPath,
    recipe: normalizeRecipe(data.recipe),
  };
};

const normalizeRecipe = (recipe: DocumentFile['recipe']): DocumentFile['recipe'] => {
  if (!recipe) {
    return undefined;
  }

  const title = String(recipe.title ?? '').trim();
  const ingredientGroups = normalizeIngredientGroups(recipe.ingredientGroups);
  const instructionSections = normalizeInstructionSections(recipe.instructionSections);
  const storageNotes = normalizeStorageNotes(recipe.storageNotes);
  const nutritionPerServing = normalizeNutritionRows(recipe.nutritionPerServing);

  const flattenedIngredients = ingredientGroups.flatMap((group) => group.items);
  const flattenedInstructions = instructionSections
    .flatMap((section) => section.steps)
    .map((step) => step.description || step.title)
    .filter((step) => step.length > 0);

  const ingredients =
    flattenedIngredients.length > 0
      ? flattenedIngredients
      : normalizeStringArray(recipe.ingredients);
  const instructions =
    flattenedInstructions.length > 0
      ? flattenedInstructions
      : normalizeStringArray(recipe.instructions);

  const macros = normalizeMacros(recipe.macros, nutritionPerServing);

  return {
    title,
    ingredients,
    instructions,
    macros,
    servings: normalizeNullableNumber(recipe.servings),
    prepTimeMinutes: normalizeNullableNumber(recipe.prepTimeMinutes),
    cookTimeMinutes: normalizeNullableNumber(recipe.cookTimeMinutes),
    totalTimeMinutes: normalizeNullableNumber(recipe.totalTimeMinutes),
    ingredientGroups,
    instructionSections,
    storageNotes,
    nutritionPerServing,
  };
};

const normalizeIngredientGroups = (
  groups: DocumentFile['recipe'] extends { ingredientGroups?: infer T } ? T : never,
) => {
  const sourceGroups = Array.isArray(groups) ? (groups as unknown[]) : [];

  const normalizedGroups = sourceGroups
    .filter(
      (group): group is Record<string, unknown> => typeof group === 'object' && group !== null,
    )
    .map((group) => ({
      title: String(group.title ?? '').trim() || 'Ingredienser',
      items: normalizeStringArray(group.items),
    }))
    .filter((group) => group.items.length > 0);

  return normalizedGroups;
};

const normalizeInstructionSections = (
  sections: DocumentFile['recipe'] extends { instructionSections?: infer T } ? T : never,
) => {
  const sourceSections = Array.isArray(sections) ? (sections as unknown[]) : [];

  const normalizedSections = sourceSections
    .filter(
      (section): section is Record<string, unknown> =>
        typeof section === 'object' && section !== null,
    )
    .map((section) => ({
      title: String(section.title ?? '').trim() || 'Fremgangsmåde',
      steps: normalizeInstructionSteps(section.steps),
    }))
    .filter((section) => section.steps.length > 0);

  return normalizedSections;
};

const normalizeInstructionSteps = (value: unknown): { title: string; description: string }[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((step) => {
      if (typeof step === 'string') {
        return {
          title: '',
          description: step.trim(),
        };
      }

      if (typeof step === 'object' && step !== null) {
        const stepRecord = step as Record<string, unknown>;

        return {
          title: String(stepRecord.title ?? '').trim(),
          description: String(stepRecord.description ?? '').trim(),
        };
      }

      return {
        title: '',
        description: '',
      };
    })
    .filter((step) => step.title.length > 0 || step.description.length > 0);
};

const normalizeStorageNotes = (value: unknown): { title: string; description: string }[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((note) => {
      if (typeof note === 'string') {
        return {
          title: '',
          description: note.trim(),
        };
      }

      if (typeof note === 'object' && note !== null) {
        const noteRecord = note as Record<string, unknown>;

        return {
          title: String(noteRecord.title ?? '').trim(),
          description: String(noteRecord.description ?? '').trim(),
        };
      }

      return {
        title: '',
        description: '',
      };
    })
    .filter((note) => note.title.length > 0 || note.description.length > 0);
};

const normalizeNutritionRows = (
  rows: DocumentFile['recipe'] extends { nutritionPerServing?: infer T } ? T : never,
) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return (rows as unknown[])
    .filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
    .map((row) => ({
      name: String(row.name ?? '').trim(),
      value: String(row.value ?? '').trim(),
      unit: String(row.unit ?? '').trim(),
    }))
    .filter((row) => row.name && row.value);
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const normalizeMacros = (
  macros: unknown,
  nutritionRows: { name: string; value: string }[],
): string[] => {
  const macroValues = normalizeStringArray(macros);

  if (macroValues.length === 4) {
    return macroValues;
  }

  const normalizedRows = new Map(
    nutritionRows.map((row) => [row.name.trim().toLowerCase(), row.value.trim()]),
  );

  return [
    macroValues[0] || normalizedRows.get('kalorier') || '',
    macroValues[1] || normalizedRows.get('protein') || '',
    macroValues[2] || normalizedRows.get('kulhydrat') || normalizedRows.get('kulhydrater') || '',
    macroValues[3] || normalizedRows.get('fedt') || '',
  ];
};

const normalizeNullableNumber = (value: unknown): number | null | undefined => {
  if (value === null) {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return undefined;
};
