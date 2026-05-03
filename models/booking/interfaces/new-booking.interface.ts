import { TimePeriod } from './time-period.interface';

export interface NewBooking {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  date: string;
  timePeriod: TimePeriod;
  comment?: string;
}
