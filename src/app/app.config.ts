import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  signal,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { AUTH_STATE, AuthState, logoutReducer } from '@modules/auth';
import {
  provideFirebaseApp,
  provideFirebaseAuth,
  provideFirebaseFunctions,
} from '@modules/firebase';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideHotToastConfig } from '@ngxpert/hot-toast';
import { routes } from './app.routes';
import { AdminEffects, adminFeature, adminReducer } from './modules/admin-menu';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled' })),
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
    provideHotToastConfig(),
    provideStore(
      {
        [adminFeature]: adminReducer,
      },
      {
        metaReducers: [logoutReducer],
      },
    ),
    provideEffects(AdminEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
