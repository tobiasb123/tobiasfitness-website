import { Booking, BookingBase, Service } from '@models/booking/interfaces';
import { DocumentReference, getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { getBlockedDays, getTimePeriods } from '../../shared/config/config.shared';
import { createAuthEndpoint, createPublicEndpoint } from '../../shared/http';
import { getUser } from '../auth/common/auth.common';
import { sendMail } from '../mail/common/mail.common';
import { commonGetBookings, doesPeriodMatch } from './common/booking.common';
import moment = require('moment-timezone');

const firestore = getFirestore();
const bookingsCollection = firestore.collection('bookings');
const servicesCollection = firestore.collection('services');

export const getBookings = createAuthEndpoint(async (req, res) => {
  const bookings = await commonGetBookings();
  res.json(bookings);
});

export const newBooking = createAuthEndpoint(async (req, res, user) => {
  const userProfile = await getUser(user.uid);
  const data = req.body as BookingBase;
  const currentDate = moment();
  const chosenDate = moment(data.date);

  if (chosenDate.diff(currentDate, 'days') < 2) {
    throw new HttpsError('out-of-range', 'Du kan tidligst booke 2 dage efter nuværende dato');
  }

  const chosenTimePeriod = data.timePeriod;
  const timePeriods = await getTimePeriods();
  const isPeriodValid = timePeriods.some((timePeriod) => {
    return (
      timePeriod.start.hour === chosenTimePeriod.start.hour &&
      timePeriod.start.minute === chosenTimePeriod.start.minute &&
      timePeriod.end.hour === chosenTimePeriod.end.hour &&
      timePeriod.end.minute === chosenTimePeriod.end.minute
    );
  });

  if (!isPeriodValid) {
    throw new HttpsError('invalid-argument', 'Det valgte tidsrum er ikke tilladt');
  }

  const blockedDays = await getBlockedDays();
  const chosenWeekDay = chosenDate.get('weekday');

  if (blockedDays.includes(chosenWeekDay)) {
    throw new HttpsError('unavailable', 'Den valgte dag er ikke tilladt');
  }

  const bookings = await commonGetBookings();
  const bookingExists = bookings.some((booking) => {
    const bookingDate = moment(booking.date);
    const periodMatches = doesPeriodMatch(chosenTimePeriod, booking.timePeriod);
    return bookingDate.isSame(chosenDate) && periodMatches;
  });

  if (bookingExists) {
    throw new HttpsError('already-exists', 'Dette tidsrum er ikke tilgængeligt');
  }

  const abortBooking = async (booking: DocumentReference): Promise<void> => {
    await booking.delete();
    throw new HttpsError('aborted', 'Der skete en fejl. Din booking blev ikke oprettet');
  };

  const booking = await bookingsCollection
    .add(data)
    .then(async (bookingDoc) => {
      return sendMail(
        data.email,
        'Bekræftelse af Booking',
        `Hej ${data.firstName} ${data.lastName}<br />
        din booking
        <br />
        D.${data.date}
        <br />
        kl.${data.timePeriod.start.hour}:${data.timePeriod.start.minute}-${data.timePeriod.end.hour}:${data.timePeriod.end.minute} 
        er blevet godkendt.
        <br /> 
        <br /> 
        Hvis du har yderligere spørgsmål er du meget velkommen til at besvare denne mail. 
        <br /> 
        <br /> 
        Venlig Hilsen<br />
        Tobias Bastholm
        <br /> 
        <br /> 
        <br /> 
        <br />
        <img src="https://tobiasbastholmfitness.dk/Tobias_Bastholm_Fitness_Logo.png" alt="Firma Logo" width="100%" />`,
      )
        .then(async () => {
          return sendMail(
            'tobiasbastholmfitness@gmail.com',
            'Booking',
            `
            Navn: ${userProfile.firstName} ${userProfile.lastName}
            <br /> 
            Dato: ${data.date}.
            <br /> 
            Tid: kl.${data.timePeriod.start.hour}:${data.timePeriod.start.minute}-${data.timePeriod.end.hour}:${data.timePeriod.end.minute}.
            <br /> 
            Service: ${data.service}. 
            <br /> <br /> <br /> <br /> 
            <img src="https://tobiasbastholmfitness.dk/Tobias_Bastholm_Fitness_Logo.png" alt="Firma Logo" width="100%" />
            `,
          )
            .then(async () => {
              const bookingSnap = await bookingDoc.get();
              return <Booking>{
                ...bookingSnap.data(),
                id: bookingDoc.id,
              };
            })
            .catch(async () => {
              await abortBooking(bookingDoc);
            });
        })
        .catch(async () => {
          await abortBooking(bookingDoc);
        });
    })
    .catch(() => {
      throw new HttpsError('aborted', 'Der skete en fejl. Din booking blev ikke oprettet');
    });

  res.json(booking);
});

export const getServices = createPublicEndpoint(async (req, res) => {
  const services = await servicesCollection.get().then((servicesSnap) => {
    const services: Service[] = [];

    for (const serviceDoc of servicesSnap.docs) {
      const service = serviceDoc.data() as Service;

      services.push({
        ...service,
        id: serviceDoc.id,
      });
    }

    return services;
  });

  res.json(services);
});
