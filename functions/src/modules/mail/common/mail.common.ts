import { Mail } from '@models/mail';
import { getFirestore } from 'firebase-admin/firestore';

const firestore = getFirestore();
const mailCollection = firestore.collection('mail');

export const sendMail = async (mail: string, subject: string, html: string): Promise<void> => {
  const newMail: Mail = {
    to: [mail],
    message: {
      subject,
      html,
    },
  };

  await mailCollection.add(newMail);
};
