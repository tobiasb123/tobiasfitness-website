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
import { createAdminEndpoint, createAuthEndpoint } from '../../shared/http';
import { getUser } from '../auth/common/auth.common';
import { commonGetFileNameFromPath, commonGetFileTypePath } from './common/storage-path.common';
import {
  commonGetRecipe,
  commonGetRecipies,
  commonNormalizeFileName,
  commonValidateIntentContentType,
} from './common/storage.common';
import { UploadIntentDocument } from './interfaces/upload-intent-document.interface';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const UPLOAD_INTENT_EXPIRY_MINUTES = 15;

const firestore = getFirestore();
const recipeCollection = firestore.collection('recipes');
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

  if (input.title) {
    uploadIntentData.title = input.title;
  }

  if (input.reviewText) {
    uploadIntentData.reviewText = input.reviewText;
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
    const fileData: Omit<DocumentFile, 'id' | 'fileType' | 'fileName' | 'folderPath'> = {
      filePath: activeFile.name,
      fileUrl,
      uid:
        uploadIntent.fileType === 'recipe'
          ? (uploadIntent.recipeUid ?? existingFile?.uid ?? 'all')
          : (existingFile?.uid ?? user.uid),
      timeCreated,
      recipe: uploadIntent.recipe ?? existingFile?.recipe,
      title: uploadIntent.title ?? existingFile?.title,
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
      title: data.title,
      recipe: data.recipe,
    })
    .catch(() => {
      throw new HttpsError('unknown', 'Opskrift blev ikke ændret');
    });

  res.json();
});

export const getRecipe = createAuthEndpoint(async (req, res) => {
  const recipe = await commonGetRecipe(req.body);
  res.json(recipe);
});

export const getRecipies = createAuthEndpoint(async (req, res) => {
  const recipies = await commonGetRecipies();
  res.json(recipies);
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
  };
};
