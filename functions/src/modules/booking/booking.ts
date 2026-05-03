import { Booking, NewBooking } from '@models/booking';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { getBlockedDays, getTimePeriods } from '../../shared/config/config.shared';
import { createAuthEndpoint } from '../../shared/http';
import { doesPeriodMatch, getBookings } from './common/booking.common';
import moment = require('moment-timezone');

const firestore = getFirestore();
const bookingsCollection = firestore.collection('bookings');

export const newBooking = createAuthEndpoint(async (req, res, uid) => {
  const data = req.body as NewBooking;
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

  const bookings = await getBookings();
  const bookingExists = bookings.some((booking) => {
    const bookingDate = moment(booking.date);
    const periodMatches = doesPeriodMatch(chosenTimePeriod, booking.timePeriod);
    return bookingDate.isSame(chosenDate) && periodMatches;
  });

  if (bookingExists) {
    throw new HttpsError('already-exists', 'Dette tidsrum er ikke tilgængeligt');
  }

  const booking = await bookingsCollection.add(data).then(async (bookingDoc) => {
    const bookingSnap = await bookingDoc.get();
    return <Booking>{
      ...bookingSnap.data(),
      id: bookingDoc.id,
    };
  });

  res.json(booking);
});
