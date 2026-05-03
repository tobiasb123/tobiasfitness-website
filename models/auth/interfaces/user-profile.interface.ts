import { BaseProfile } from './base-profile.interface';

export interface UserProfile extends BaseProfile {
  uid: string;
  email: string;
  admin?: boolean;
}
