import { DocumentFile } from '@models/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/https';
import { createAdminEndpoint } from '../../shared/http';

const firestore = getFirestore();
const recipeCollection = firestore.collection('recipe');

export const saveRecipe = createAdminEndpoint(async (req, res) => {
  const data = req.body as DocumentFile;

  await recipeCollection
    .add(data)
    .then(() => {
      console.log(data);
    })
    .catch(() => {
      throw new HttpsError('unknown', 'Der skete en ukendt fejl. Opskriften blev ikke gemt');
    });

  res.json();
});
