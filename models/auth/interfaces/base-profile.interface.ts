import { Address } from './address.interface';

export interface BaseProfile {
  firstName: string;
  lastName: string;
  age: number;
  phoneNumber: string;
  address: Address;
}
