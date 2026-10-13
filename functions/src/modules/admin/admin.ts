import { Booking, BookingAvailability, TimePeriod } from '@models/booking/interfaces';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/https';
import { createAdminEndpoint } from '../../shared/http';
import { setBookingAvailability } from '../../shared/config';
import { getAllUsers } from '../auth/common/auth.common';
import { sendMail } from '../mail/common/mail.common';

const firestore = getFirestore();
const bookingsCollection = firestore.collection('bookings');

export const getUsers = createAdminEndpoint(async (req, res, user) => {
  const users = await getAllUsers();
  res.json(users);
});

const parseBookingAvailability = (value: unknown): BookingAvailability => {
  if (typeof value !== 'object' || value === null) {
    throw new HttpsError('invalid-argument', 'Bookingstiderne er ugyldige');
  }

  const input = value as { blockedDays?: unknown; timePeriods?: unknown };
  const blockedDays = Array.isArray(input.blockedDays)
    ? input.blockedDays.filter(
        (day: unknown): day is number =>
          typeof day === 'number' && Number.isInteger(day) && day >= 0 && day <= 6,
      )
    : [];
  if (
    !Array.isArray(input.blockedDays) ||
    blockedDays.length !== input.blockedDays.length ||
    new Set(blockedDays).size !== blockedDays.length ||
    !Array.isArray(input.timePeriods)
  ) {
    throw new HttpsError('invalid-argument', 'Bookingstiderne er ugyldige');
  }

  const timePeriods = input.timePeriods.map((value): TimePeriod => {
    if (typeof value !== 'object' || value === null) {
      throw new HttpsError('invalid-argument', 'Et tidsrum er ugyldigt');
    }

    const period = value as {
      start?: { hour?: unknown; minute?: unknown };
      end?: { hour?: unknown; minute?: unknown };
    };
    const parseTime = (time: { hour?: unknown; minute?: unknown } | undefined) => {
      const hour = typeof time?.hour === 'string' ? Number(time.hour) : Number.NaN;
      const minute = typeof time?.minute === 'string' ? Number(time.minute) : Number.NaN;

      if (
        !Number.isInteger(hour) ||
        hour < 0 ||
        hour > 23 ||
        !Number.isInteger(minute) ||
        minute < 0 ||
        minute > 59
      ) {
        throw new HttpsError('invalid-argument', 'Et tidsrum indeholder et ugyldigt klokkeslæt');
      }

      return { hour: String(hour).padStart(2, '0'), minute: String(minute).padStart(2, '0') };
    };

    return { start: parseTime(period.start), end: parseTime(period.end) };
  });

  const minuteValue = (time: TimePeriod['start']) => Number(time.hour) * 60 + Number(time.minute);
  const sortedPeriods = [...timePeriods].sort(
    (first, second) => minuteValue(first.start) - minuteValue(second.start),
  );
  for (let index = 0; index < sortedPeriods.length; index++) {
    const period = sortedPeriods[index];
    if (minuteValue(period.start) >= minuteValue(period.end)) {
      throw new HttpsError('invalid-argument', 'Sluttid skal være efter starttid');
    }
    if (index > 0 && minuteValue(sortedPeriods[index - 1].end) > minuteValue(period.start)) {
      throw new HttpsError('invalid-argument', 'Tidsrum må ikke overlappe hinanden');
    }
  }

  return { blockedDays, timePeriods };
};

export const setBookingAvailabilityEndpoint = createAdminEndpoint(async (req, res) => {
  const availability = parseBookingAvailability(req.body);
  await setBookingAvailability(availability);
  res.json({ success: true });
});

export const deleteBooking = createAdminEndpoint(async (req, res) => {
  const id = req.body as string;
  const bookingDoc = await bookingsCollection.doc(id).get();
  const booking = bookingDoc.data() as Booking;

  if (!bookingDoc.exists) {
    throw new HttpsError('not-found', 'Booking findes ikke');
  }

  const formatBookingDate = (date: string): string => {
    return date ? date.split('-').reverse().join('-') : date;
  };

  const startHour = String(booking.timePeriod.start.hour).padStart(2, '0');
  const startMinute = String(booking.timePeriod.start.minute).padStart(2, '0');
  const endHour = String(booking.timePeriod.end.hour).padStart(2, '0');
  const endMinute = String(booking.timePeriod.end.minute).padStart(2, '0');
  const bookingTime = `${startHour}:${startMinute} - ${endHour}:${endMinute}`;

  await bookingDoc.ref
    .delete()
    .then(() => {
      sendMail(
        booking.email,
        'Aflyst booking',
        `<div style="font-family: Arial, sans-serif; background-color: #f5f7fb; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);">
            <div style="background-color: #0f172a; padding: 24px 32px; color: #ffffff;">
              <h2 style="margin: 0 0 8px; font-size: 24px;">Booking aflyst</h2>
              <p style="margin: 0; font-size: 15px; color: #cbd5e1;">Hej ${booking.firstName} ${booking.lastName}</p>
            </div>
            <div style="padding: 32px; color: #1f2937;">
              <p style="margin: 0 0 16px; font-size: 16px;">Din booking er blevet aflyst.</p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 8px; font-size: 15px;"><strong>Dato:</strong> ${formatBookingDate(booking.date)}</p>
                <p style="margin: 0 0 8px; font-size: 15px;"><strong>Tid:</strong> ${bookingTime}</p>
                <p style="margin: 0; font-size: 15px;"><strong>Service:</strong> ${booking.service}</p>
              </div>
              <p style="margin: 0 0 8px; font-size: 14px; color: #475569;">Hvis du har nogle spørgsmål er du meget velkommen til at kontakte mig via hjemmesiden.</p>
              <p style="margin: 0; font-size: 14px; color: #475569;">Venlig hilsen<br />Tobias Bastholm</p>
            </div>
            <div style="padding: 0 32px 24px;">
              <img src="https://tobiasbastholmfitness.dk/Tobias_Bastholm_Fitness_Logo.png" alt="Firma Logo" width="100%" style="display: block; max-width: 240px; margin: 0 auto;" />
            </div>
          </div>
        </div>`,
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

  const existingBooking = bookingDoc.data() as Booking;

  const formatBookingDate = (date: string): string => {
    return date ? date.split('-').reverse().join('-') : date;
  };

  const formatBookingTime = (booking: Booking): string => {
    const startHour = String(booking.timePeriod.start.hour).padStart(2, '0');
    const startMinute = String(booking.timePeriod.start.minute).padStart(2, '0');
    const endHour = String(booking.timePeriod.end.hour).padStart(2, '0');
    const endMinute = String(booking.timePeriod.end.minute).padStart(2, '0');

    return `${startHour}:${startMinute} - ${endHour}:${endMinute}`;
  };

  const changes: string[] = [];

  if (existingBooking.date !== data.date) {
    changes.push(
      `<li><strong>Dato:</strong> ${formatBookingDate(existingBooking.date)} -> ${formatBookingDate(data.date)}</li>`,
    );
  }

  if (formatBookingTime(existingBooking) !== formatBookingTime(data)) {
    changes.push(
      `<li><strong>Tid:</strong> ${formatBookingTime(existingBooking)} -> ${formatBookingTime(data)}</li>`,
    );
  }

  if (existingBooking.service !== data.service) {
    changes.push(
      `<li><strong>Service:</strong> ${existingBooking.service} -> ${data.service}</li>`,
    );
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
    .then(async () => {
      await sendMail(
        data.email,
        'Din booking er blevet ændret',
        `
        <div style="font-family: Arial, sans-serif; background-color: #f5f7fb; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);">
            <div style="background-color: #0f172a; padding: 24px 32px; color: #ffffff;">
              <h2 style="margin: 0 0 8px; font-size: 24px;">Booking ændret</h2>
              <p style="margin: 0; font-size: 15px; color: #cbd5e1;">Hej ${data.firstName} ${data.lastName}</p>
            </div>
            <div style="padding: 32px; color: #1f2937;">
              <p style="margin: 0 0 16px; font-size: 16px;">Din booking er blevet opdateret. Her er de ændringer, der er lavet:</p>
              <ul style="margin: 0 0 20px; padding-left: 20px; color: #475569;">
                ${changes.length > 0 ? changes.join('') : '<li>Din booking er blevet opdateret.</li>'}
              </ul>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 8px; font-size: 15px;"><strong>Ny dato:</strong> ${formatBookingDate(data.date)}</p>
                <p style="margin: 0 0 8px; font-size: 15px;"><strong>Ny tid:</strong> ${formatBookingTime(data)}</p>
                <p style="margin: 0; font-size: 15px;"><strong>Service:</strong> ${data.service}</p>
              </div>
              <p style="margin: 0 0 8px; font-size: 14px; color: #475569;">Hvis du har nogle spørgsmål er du meget velkommen til at kontakte mig via hjemmesiden.</p>
              <p style="margin: 0; font-size: 14px; color: #475569;">Venlig hilsen<br />Tobias Bastholm</p>
            </div>
            <div style="padding: 0 32px 24px;">
              <img src="https://tobiasbastholmfitness.dk/Tobias_Bastholm_Fitness_Logo.png" alt="Firma Logo" width="100%" style="display: block; max-width: 240px; margin: 0 auto;" />
            </div>
          </div>
        </div>`,
      );
    })
    .catch(() => {
      throw new HttpsError('unknown', 'Booking blev ikke ændret');
    });

  res.json();
});
