import { Booking } from '@models/booking/interfaces';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/https';
import { createAdminEndpoint } from '../../shared/http';
import { getAllUsers } from '../auth/common/auth.common';
import { sendMail } from '../mail/common/mail.common';

const firestore = getFirestore();
const bookingsCollection = firestore.collection('bookings');
const usersCollection = firestore.collection('users');

export const getUsers = createAdminEndpoint(async (req, res, user) => {
  const users = await getAllUsers();
  res.json(users);
});

export const deleteBooking = createAdminEndpoint(async (req, res) => {
  const id = req.body as string;
  const bookingDoc = await bookingsCollection.doc(id).get();
  const booking = bookingDoc.data() as Booking;

  if (!bookingDoc.exists) {
    throw new HttpsError('not-found', 'Booking findes ikke');
  }

  await bookingDoc.ref
    .delete()
    .then(() => {
      sendMail(
        booking.email,
        'Aflyst booking',
        `Hej ${booking.firstName} ${booking.lastName}
        <br /> 
        <br />
        Din tid d. ${booking.date} kl.${booking.timePeriod.start.hour}:${booking.timePeriod.start.minute}-${booking.timePeriod.end.hour}:${booking.timePeriod.end.minute} 
        er blevet aflyst.
        <br /> 
        <br />
        Hvis du har yderligere spørgsmål eller du tror der er sket en fejl, 
        er du meget velkommen til at besvare denne mail.
        <br /> 
        <br /> 
        <br /> 
        Venlig Hilsen
        <br />
        Tobias Bastholm
        <br /> 
        <br /> 
        <br /> 
        <br />
        <img src="https://tobiasbastholmfitness.dk/Tobias_Bastholm_Fitness_Logo.png" alt="Firma Logo" width="100%" />`,
      );
    })
    .catch(() => {
      throw new HttpsError('unknown', 'Booking blev ikke slettet');
    });

  res.json();
});

export const editBooking = createAdminEndpoint(async (req, res) => {
  const data = req.body as Booking;
  const bookingDoc = await bookingsCollection.doc(data.id).get();

  if (!bookingDoc.exists) {
    throw new HttpsError('not-found', 'Booking findes ikke');
  }

  await bookingDoc.ref
    .update({
      uid: data.uid,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      date: data.date,
      timePeriod: data.timePeriod,
      service: data.service,
    })
    .catch(() => {
      throw new HttpsError('unknown', 'Booking blev ikke ændret');
    });

  res.json();
});
