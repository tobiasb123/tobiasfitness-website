import { Address } from './address.interface';

export interface BaseProfile {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: Address;
}
