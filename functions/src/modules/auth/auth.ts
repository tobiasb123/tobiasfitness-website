import { BaseProfile, UserProfile } from '@models/auth';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/https';
import { createAuthEndpoint } from '../../shared/http';

const firestore = getFirestore();
const usersCollection = firestore.collection('users');

export const register = createAuthEndpoint(async (req, res, user) => {
  const data = req.body as BaseProfile;
  const userProfile: UserProfile = {
    ...data,
    email: user.email!,
    uid: user.uid,
  };

  await usersCollection.add(userProfile).catch(async () => {
    await getAuth()
      .deleteUser(user.uid)
      .catch(() => {
        throw new HttpsError(
          'aborted',
          'Opretning af konto fejlede. Venligst kontakt kundeservice',
        );
      });
    throw new HttpsError('aborted', 'Opretning af konto fejlede. Venligst kontakt kundeservice');
  });

  res.json(userProfile);
});

export const updateDetails = createAuthEndpoint(async (req, res, user) => {
  const data = req.body as Partial<UserProfile>;
  const emailChanged = !!data.email && data.email !== user.email;

  if (emailChanged) {
    await getAuth()
      .updateUser(user.uid, {
        email: data.email,
      })
      .catch(() => {
        throw new HttpsError('internal', 'Dine oplysninger kunne ikke opdateres');
      });
  }

  const userProfileUpdate: Partial<BaseProfile> = {
    firstName: data.firstName,
    lastName: data.lastName,
    phoneNumber: data.phoneNumber,
    address: data.address,
  };

  const hasProfileChanges = Object.values(userProfileUpdate).some((value) => value !== undefined);

  if (hasProfileChanges) {
    const userProfileDoc = await usersCollection.doc(user.uid).get();

    if (!userProfileDoc.exists) {
      throw new HttpsError('not-found', 'Dine oplysninger kunne ikke opdateres');
    }

    await userProfileDoc.ref.update(userProfileUpdate).catch(() => {
      throw new HttpsError('internal', 'Dine oplysninger kunne ikke opdateres');
    });
  }

  res.json();
});
