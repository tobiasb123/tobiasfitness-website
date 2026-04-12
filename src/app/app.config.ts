import { ApplicationConfig, provideBrowserGlobalErrorListeners, signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  provideFirebaseApp,
  provideFirebaseAuth,
  provideFirebaseFunctions,
} from '@modules/firebase';
import { AUTH_STATE, AuthState } from '@modules/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideFirebaseApp({
      apiKey: 'AIzaSyD4aM8s3h0tHWI8jr9K41jYKLNt7GPTnTg',
      authDomain: 'tobiasbastholmfitness.firebaseapp.com',
      projectId: 'tobiasbastholmfitness',
      storageBucket: 'tobiasbastholmfitness.firebasestorage.app',
      messagingSenderId: '515583852079',
      appId: '1:515583852079:web:d7350255f257bbaf4990da',
      measurementId: 'G-ZXXQ1J4EHB',
    }),
    provideFirebaseAuth(),
    provideFirebaseFunctions(),
    {
      provide: AUTH_STATE,
      useValue: signal<AuthState>('loading'),
    },
  ],
};
