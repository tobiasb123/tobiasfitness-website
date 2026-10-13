import { BookingAvailability, TimePeriod } from '@models/booking/interfaces';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/https';
import { Config } from './interfaces/config.interface';

const DEFAULT_BLOCKED_DAYS: number[] = [3];
const DEFAULT_TIME_PERIODS: TimePeriod[] = [
  { start: { hour: '09', minute: '00' }, end: { hour: '10', minute: '00' } },
  { start: { hour: '11', minute: '00' }, end: { hour: '12', minute: '00' } },
  { start: { hour: '13', minute: '00' }, end: { hour: '14', minute: '00' } },
  { start: { hour: '15', minute: '00' }, end: { hour: '16', minute: '00' } },
  { start: { hour: '17', minute: '00' }, end: { hour: '18', minute: '00' } },
];

const firestore = getFirestore();
const configCollection = firestore.collection('config');

export const getTimePeriods = async (): Promise<TimePeriod[]> => {
  const doc = await configCollection.doc('time-periods').get();

  if (!doc.exists) {
    return DEFAULT_TIME_PERIODS.map((period) => ({
      start: { ...period.start },
      end: { ...period.end },
    }));
  }

  const config = doc.data() as Config<TimePeriod[]>;
  return config.data ?? [];
};

export const getBlockedDays = async (): Promise<number[]> => {
  const doc = await configCollection.doc('blocked-days').get();

  if (!doc.exists) {
    return [...DEFAULT_BLOCKED_DAYS];
  }

  const config = doc.data() as Config<number[]>;
  return config.data ?? [];
};

export const setBookingAvailability = async ({
  blockedDays,
  timePeriods,
}: BookingAvailability): Promise<void> => {
  const batch = firestore.batch();
  batch.set(configCollection.doc('blocked-days'), { data: blockedDays });
  batch.set(configCollection.doc('time-periods'), { data: timePeriods });

  await batch.commit().catch(() => {
    throw new HttpsError('internal', 'Bookingstiderne blev ikke gemt på grund af en ukendt fejl');
  });
};

export const setTimePeriods = async (periods: TimePeriod[]): Promise<void> => {
  const timePeriodsConfig: Config<TimePeriod[]> = {
    data: periods,
  };

  await configCollection
    .doc('time-periods')
    .set(timePeriodsConfig)
    .catch(() => {
      throw new HttpsError('internal', 'Tids perioderne blev ikke gemt på grund af en ukendt fejl');
    });
};

export const setBlockedDays = async (days: number[]): Promise<void> => {
  const blockedDaysConfig: Config<number[]> = {
    data: days,
  };

  await configCollection
    .doc('blocked-days')
    .set(blockedDaysConfig)
    .catch(() => {
      throw new HttpsError(
        'internal',
        'Ændring af blokerede dage fejlde på grund af en ukendt fejl',
      );
    });
};
