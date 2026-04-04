import { InjectionToken } from '@angular/core';
import { Functions } from 'firebase/functions';

export const FIREBASE_FUNCTIONS = new InjectionToken<Functions>('FIREBASE_FUNCTIONS');
