import {
  Booking,
  BookingBase,
  RescheduleBookingRequest,
  Service,
} from '@models/booking/interfaces';
import { DocumentReference, getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import {
  getBlockedDays,
  getTimePeriods as getTimePeriodsConfig,
} from '../../shared/config/config.shared';
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
  const timePeriods = await getTimePeriodsConfig();
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

  const bookingDate = moment(data.date).format('DD-MM-YYYY');
  const bookingStartHour = String(data.timePeriod.start.hour).padStart(2, '0');
  const bookingStartMinute = String(data.timePeriod.start.minute).padStart(2, '0');
  const bookingEndHour = String(data.timePeriod.end.hour).padStart(2, '0');
  const bookingEndMinute = String(data.timePeriod.end.minute).padStart(2, '0');
  const bookingTime = `kl. ${bookingStartHour}:${bookingStartMinute} - ${bookingEndHour}:${bookingEndMinute}`;
  const accountManagementUrl = 'https://tobiasbastholmfitness.dk/account-management';

  const booking = await bookingsCollection
    .add(data)
    .then(async (bookingDoc) => {
      return sendMail(
        data.email,
        'Bekræftelse af Booking',
        `<div style="font-family: Arial, sans-serif; background-color: #f5f7fb; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);">
            <div style="background-color: #0f172a; padding: 24px 32px; color: #ffffff;">
              <h2 style="margin: 0 0 8px; font-size: 24px;">Booking bekræftet</h2>
              <p style="margin: 0; font-size: 15px; color: #cbd5e1;">Hej ${data.firstName} ${data.lastName}</p>
            </div>
            <div style="padding: 32px; color: #1f2937;">
              <p style="margin: 0 0 16px; font-size: 16px;">Din booking er nu oprettet og er klar til at blive fulgt op.</p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 8px; font-size: 15px;"><strong>Navn:</strong> ${data.firstName} ${data.lastName}</p>
                <p style="margin: 0 0 8px; font-size: 15px;"><strong>Dato:</strong> ${bookingDate}</p>
                <p style="margin: 0; font-size: 15px;"><strong>Tid:</strong> ${bookingTime}</p>
              </div>
              <p style="margin: 0 0 16px; font-size: 15px;">Du kan administrere og få overblik over din booking direkte i din konto.</p>
              <p style="margin: 0 0 24px;">
                <a href="${accountManagementUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: bold;">Gå til kontooversigt</a>
              </p>
              <p style="margin: 0 0 8px; font-size: 14px; color: #475569;">Hvis du ønsker at aflyse eller ændre din booking, skal du sende en mail til <a href="mailto:tobiasbastholmfitness@gmail.com" style="color: #2563eb; text-decoration: none;">tobiasbastholmfitness@gmail.com</a>.</p>
              <p style="margin: 0 0 8px; font-size: 14px; color: #475569;">Hvis du har nogle spørgsmål er du meget velkommen til at kontakte mig via hjemmesiden.</p>
              <p style="margin: 0; font-size: 14px; color: #475569;">Venlig hilsen<br />Tobias Bastholm</p>
            </div>
            <div style="padding: 0 32px 24px;">
              <img src="https://tobiasbastholmfitness.dk/Tobias_Bastholm_Fitness_Logo.png" alt="Firma Logo" width="100%" style="display: block; max-width: 240px; margin: 0 auto;" />
            </div>
          </div>
        </div>`,
      )
        .then(async () => {
          return sendMail(
            'tobiasbastholmfitness@gmail.com',
            'Booking',
            `<div style="font-family: Arial, sans-serif; background-color: #f5f7fb; padding: 24px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);">
                <div style="background-color: #0f172a; padding: 24px 32px; color: #ffffff;">
                  <h2 style="margin: 0 0 8px; font-size: 24px;">Ny booking modtaget</h2>
                  <p style="margin: 0; font-size: 15px; color: #cbd5e1;">En ny booking er blevet oprettet</p>
                </div>
                <div style="padding: 32px; color: #1f2937;">
                  <p style="margin: 0 0 16px; font-size: 16px;">Her er detaljerne for den nye booking.</p>
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
                    <p style="margin: 0 0 8px; font-size: 15px;"><strong>Navn:</strong> ${userProfile.firstName} ${userProfile.lastName}</p>
                    <p style="margin: 0 0 8px; font-size: 15px;"><strong>Dato:</strong> ${bookingDate}</p>
                    <p style="margin: 0 0 8px; font-size: 15px;"><strong>Tid:</strong> ${bookingTime}</p>
                    <p style="margin: 0; font-size: 15px;"><strong>Service:</strong> ${data.service}</p>
                  </div>
                  <p style="margin: 0 0 8px; font-size: 14px; color: #475569;">Hvis kunden ønsker at aflyse eller ændre booking, skal de sende en mail til <a href="mailto:tobiasbastholmfitness@gmail.com" style="color: #2563eb; text-decoration: none;">tobiasbastholmfitness@gmail.com</a>.</p>
                  <p style="margin: 0; font-size: 14px; color: #475569;">Venlig hilsen<br />Tobias Bastholm</p>
                </div>
                <div style="padding: 0 32px 24px;">
                  <img src="https://tobiasbastholmfitness.dk/Tobias_Bastholm_Fitness_Logo.png" alt="Firma Logo" width="100%" style="display: block; max-width: 240px; margin: 0 auto;" />
                </div>
              </div>
            </div>`,
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
  const servicesSnap = await servicesCollection.get();
  const services: Service[] = [];

  for (const serviceDoc of servicesSnap.docs) {
    const rawData = serviceDoc.data();

    if (Array.isArray((rawData as { data?: Service[] }).data)) {
      services.push(...(rawData as { data: Service[] }).data);
      continue;
    }

    services.push({
      ...(rawData as Service),
      id: serviceDoc.id,
    });
  }

  res.json(services);
});

export const sendRescheduleMail = createAuthEndpoint(async (req, res, user) => {
  const data = req.body as RescheduleBookingRequest;
  const bookingDoc = await bookingsCollection.doc(data.bookingId).get();

  if (!bookingDoc.exists) {
    throw new HttpsError('not-found', 'Booking findes ikke');
  }

  const booking = {
    ...(bookingDoc.data() as Booking),
    id: bookingDoc.id,
  };

  if (booking.uid !== user.uid) {
    throw new HttpsError('permission-denied', 'Du har ikke adgang til denne booking');
  }

  const userProfile = await getUser(user.uid);
  const requestedDate = moment(data.requestedDate).isValid()
    ? moment(data.requestedDate).format('DD-MM-YYYY')
    : data.requestedDate;

  await sendMail(
    'tobiasbastholmfitness@gmail.com',
    `Ønske om omlægning af booking - ${booking.service}`,
    `<div style="font-family: Arial, sans-serif; background-color: #f5f7fb; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);">
        <div style="background-color: #0f172a; padding: 24px 32px; color: #ffffff;">
          <h2 style="margin: 0 0 8px; font-size: 24px;">Ønske om omlægning</h2>
          <p style="margin: 0; font-size: 15px; color: #cbd5e1;">En kunde ønsker at flytte en booking</p>
        </div>
        <div style="padding: 32px; color: #1f2937;">
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px; font-size: 15px;"><strong>Navn:</strong> ${userProfile.firstName} ${userProfile.lastName}</p>
            <p style="margin: 0 0 8px; font-size: 15px;"><strong>Email:</strong> ${booking.email}</p>
            <p style="margin: 0 0 8px; font-size: 15px;"><strong>Service:</strong> ${booking.service}</p>
            <p style="margin: 0 0 8px; font-size: 15px;"><strong>Nuværende dato:</strong> ${moment(booking.date).format('DD-MM-YYYY')}</p>
            <p style="margin: 0 0 8px; font-size: 15px;"><strong>Nuværende tid:</strong> ${String(booking.timePeriod.start.hour).padStart(2, '0')}:${String(booking.timePeriod.start.minute).padStart(2, '0')} - ${String(booking.timePeriod.end.hour).padStart(2, '0')}:${String(booking.timePeriod.end.minute).padStart(2, '0')}</p>
            <p style="margin: 0 0 8px; font-size: 15px;"><strong>Ønsket ny dato:</strong> ${requestedDate}</p>
            <p style="margin: 0; font-size: 15px;"><strong>Ønsket ny tid:</strong> ${data.requestedTime}</p>
          </div>
          <p style="margin: 0; font-size: 14px; color: #475569;">Forespørgslen er sendt fra kontooversigten.</p>
        </div>
      </div>
    </div>`,
  );

  res.json({ success: true });
});
