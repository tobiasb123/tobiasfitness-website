import { Booking, TimePeriod } from '@models/booking';
import { getFirestore } from 'firebase-admin/firestore';
import { getTimePeriods } from '../../../shared/config';

const firestore = getFirestore();
const bookingsCollection = firestore.collection('bookings');

export const getBookings = async (): Promise<Booking[]> => {
  return await bookingsCollection.get().then((bookingSnap) => {
    const bookings: Booking[] = [];

    bookingSnap.docs.forEach((bookingDoc) => {
      const booking = bookingDoc.data() as Booking;

      bookings.push({
        ...booking,
        id: bookingDoc.id,
      });
    });

    return bookings;
  });
};

export const doesPeriodMatch = (period: TimePeriod, periodToMatch: TimePeriod): boolean => {
  return (
    period.start.hour === periodToMatch.start.hour &&
    period.start.minute === periodToMatch.start.minute &&
    period.end.hour === periodToMatch.end.hour &&
    period.end.minute === periodToMatch.end.minute
  );
};

export const isValidPeriod = async (period: TimePeriod): Promise<boolean> => {
  const timePeriods = await getTimePeriods();

  return timePeriods.some((timePeriod) => {
    return (
      timePeriod.start.hour === period.start.hour &&
      timePeriod.start.minute === period.start.minute &&
      timePeriod.end.hour === period.end.hour &&
      timePeriod.end.minute === period.end.minute
    );
  });
};
