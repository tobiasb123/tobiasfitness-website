import { BookingAvailability } from './interfaces';
import { BOOKING_TIME_OPTIONS } from './booking-time-options';

const parseTime = (value: string): { hour: string; minute: string } => {
  const [hour, minute] = value.split(':');
  return { hour, minute };
};

export const DEFAULT_BLOCKED_DAYS = [3];

export const DEFAULT_BOOKING_AVAILABILITY: BookingAvailability = {
  blockedDays: DEFAULT_BLOCKED_DAYS,
  timePeriods: BOOKING_TIME_OPTIONS.map((option) => {
    const [start, end] = option.split(' - ');
    return {
      start: parseTime(start),
      end: parseTime(end),
    };
  }),
};
