import { DocumentFile } from '@models/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/https';

const firestore = getFirestore();
const recipeCollection = firestore.collection('recipe');

export const commonGetRecipies = async (): Promise<DocumentFile[]> => {
  return await recipeCollection.get().then((recipeSnap) => {
    const recipies: DocumentFile[] = [];

    for (const recipeDoc of recipeSnap.docs) {
      const recipe = recipeDoc.data() as DocumentFile;

      recipies.push({
        ...recipe,
      });
    }

    return recipies;
  });
};

export const commonGetRecipe = async (name: string): Promise<DocumentFile> => {
  const recipeDoc = await recipeCollection.doc(name).get();
  if (!recipeDoc.exists) {
    throw new HttpsError('not-found', 'Opskrift blev ikke fundet');
  }

  return {
    ...(recipeDoc.data() as DocumentFile),
  };
};

export const commonNormalizeFileName = (fileName: string): string => {
  const normalizedFileName = fileName.trim();

  if (!normalizedFileName) {
    throw new HttpsError('invalid-argument', 'Filnavn er påkrævet');
  }

  if (
    normalizedFileName.includes('/') ||
    normalizedFileName.includes('\\') ||
    normalizedFileName === '.' ||
    normalizedFileName === '..'
  ) {
    throw new HttpsError('invalid-argument', 'Ugyldigt filnavn');
  }

  return normalizedFileName;
};

export const commonValidateIntentContentType = (contentType?: string): string => {
  if (!contentType) {
    return undefined;
  }

  const normalizedContentType = contentType.trim().toLowerCase();

  if (!normalizedContentType) {
    return undefined;
  }

  if (!normalizedContentType.startsWith('image/')) {
    throw new HttpsError('invalid-argument', 'Filen skal være et billede');
  }

  return normalizedContentType;
};
