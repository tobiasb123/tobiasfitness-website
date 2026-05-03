import { TimePeriod } from '@models/booking';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/https';
import { Config } from './interfaces/config.interface';

const firestore = getFirestore();
const configCollection = firestore.collection('config');

export const getTimePeriods = async (): Promise<TimePeriod[]> => {
  const doc = await configCollection.doc('time-periods').get();

  if (!doc.exists) {
    return [];
  }

  const config = doc.data() as Config<TimePeriod[]>;
  return config.data;
};

export const getBlockedDays = async (): Promise<number[]> => {
  const doc = await configCollection.doc('blocked-days').get();

  if (!doc.exists) {
    return [];
  }

  const config = doc.data() as Config<number[]>;
  return config.data;
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
