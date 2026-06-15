import { TimePeriod } from './time-period.interface';

export interface BookingBase {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  date: string;
  timePeriod: TimePeriod;
  service: string;
}
