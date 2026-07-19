import { TimePeriod } from './interfaces';

export const BOOKING_TIME_OPTIONS: string[] = [
  '09:00 - 10:00',
  '11:00 - 12:00',
  '13:00 - 14:00',
  '15:00 - 16:00',
  '17:00 - 18:00',
];

export const formatTimePeriodOption = (timePeriod: TimePeriod): string => {
  const startHour = String(timePeriod.start.hour).padStart(2, '0');
  const startMinute = String(timePeriod.start.minute).padStart(2, '0');
  const endHour = String(timePeriod.end.hour).padStart(2, '0');
  const endMinute = String(timePeriod.end.minute).padStart(2, '0');

  return `${startHour}:${startMinute} - ${endHour}:${endMinute}`;
};
