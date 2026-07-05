import { DocumentFile, UploadFile } from '@models/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { getDownloadURL, getStorage } from 'firebase-admin/storage';
import { HttpsError } from 'firebase-functions/https';
import moment from 'moment-timezone';
import { createAdminEndpoint, createAuthEndpoint } from '../../shared/http';
import { commonGetRecipe, commonGetRecipies } from './common/storage.common';

const firestore = getFirestore();
const recipeCollection = firestore.collection('recipe');
const storage = getStorage();
const bucket = storage.bucket();

export const saveRecipe = createAdminEndpoint(async (req, res, user) => {
  const data = req.body as UploadFile;
  const file = bucket.file(data.fileName);

  const fileAlreadyExists = await file.exists();

  if (fileAlreadyExists[0]) {
    throw new HttpsError('already-exists', 'En fil med dette navn findes allerede');
  }

  const binaryString = atob(data.base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = binaryString.charCodeAt(index);
  }
  const arrayBuffer = Buffer.from(bytes);

  await file.save(arrayBuffer).catch(() => {
    throw new HttpsError('internal', 'Filen kunne ikke blive gemt');
  });

  const metadata = (await file.getMetadata())[0];
  const timeCreated = moment(metadata.timeCreated).toString();
  const fileUrl = await getDownloadURL(file);

  const fileData: Omit<DocumentFile, 'id' | 'fileName'> = {
    uid: user.uid,
    title: data.title,
    filePath: file.name,
    fileUrl,
    timeCreated,
    recipe: data.recipe,
  };

  const docRef = await recipeCollection.add(fileData).catch(async () => {
    await file.delete();
    throw new HttpsError('internal', 'Filen kunne ikke blive gemt');
  });
  const documentFile = <DocumentFile>{
    ...fileData,
    id: docRef.id,
  };

  res.json(documentFile);
});

export const editRecipe = createAdminEndpoint(async (req, res) => {
  const data = req.body as DocumentFile;
  const recipeDoc = await recipeCollection.doc(data.id).get();

  if (!recipeDoc.exists) {
    throw new HttpsError('not-found', 'Opskrift findes ikke');
  }

  await recipeDoc.ref
    .update({
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
