import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP } from '../tokens/firebase-app.token';
import { FIREBASE_AUTH } from '../tokens/firebase-auth.token';

export function provideFirebaseAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: FIREBASE_AUTH,
      useFactory: (app: FirebaseApp) => getAuth(app),
      deps: [FIREBASE_APP],
    },
  ]);
}
