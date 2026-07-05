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
