import { UserProfile } from '@models/auth';
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
    const userProfileSnap = usersSnap.docs.find((userProfileDoc) => {
      const fireUserProfile = userProfileDoc.data() as UserProfile;
      return fireUserProfile.uid === user.uid;
    });

    if (!userProfileSnap?.exists) {
      throw new HttpsError('not-found', 'Bruger blev ikke fundet');
    }

    const userProfile = userProfileSnap.data() as UserProfile;
    userProfiles.push({
      ...userProfile,
      email: user.email!,
    });
  }

  return userProfiles;
};
