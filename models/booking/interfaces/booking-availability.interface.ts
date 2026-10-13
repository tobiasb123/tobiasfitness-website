import { TimePeriod } from './time-period.interface';

export interface BookingAvailability {
  blockedDays: number[];
  timePeriods: TimePeriod[];
}
