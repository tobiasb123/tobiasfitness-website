import { UserProfile } from '@models/auth/interfaces';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/https';

const firestore = getFirestore();
const usersCollection = firestore.collection('users');

export const getUser = async (uid: string): Promise<UserProfile> => {
  const userDoc = await usersCollection.doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Bruger blev ikke fundet');
  }

  return {
    ...(userDoc.data() as UserProfile),
    uid: userDoc.id,
  };
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const userList = await getAuth().listUsers();
  const userProfiles: UserProfile[] = [];
  const usersSnap = await usersCollection.get();

  for (const user of userList.users) {
    const userProfileDoc = usersSnap.docs.find((userProfileDoc) => userProfileDoc.id === user.uid);

    if (!userProfileDoc?.exists) {
      throw new HttpsError('not-found', 'Bruger blev ikke fundet');
    }

    const userProfile = {
      ...(userProfileDoc.data() as UserProfile),
      uid: userProfileDoc.id,
    };
    userProfiles.push({
      ...userProfile,
      email: user.email!,
    });
  }

  return userProfiles;
};
