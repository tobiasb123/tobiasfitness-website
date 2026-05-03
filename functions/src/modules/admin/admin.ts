import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/https';
import { createAdminEndpoint } from '../../shared/http';
import { getAllUsers } from '../auth/common/auth.common';

const firestore = getFirestore();
const bookingsCollection = firestore.collection('bookings');

export const getUsers = createAdminEndpoint(async (req, res, user) => {
  const users = await getAllUsers();
  res.json(users);
});

export const deleteBooking = createAdminEndpoint(async (req, res, user) => {
  const id = req.body as string;
  const bookingDoc = await bookingsCollection.doc(id).get();

  if (!bookingDoc.exists) {
    throw new HttpsError('not-found', 'Booking findes ikke');
  }

  await bookingDoc.ref.delete().catch(() => {
    throw new HttpsError('unknown', 'Booking blev ikke slettet');
  });

  res.json();
});
