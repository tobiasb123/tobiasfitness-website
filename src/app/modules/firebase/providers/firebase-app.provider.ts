import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { FirebaseOptions, initializeApp } from 'firebase/app';
import { FIREBASE_APP } from '../tokens/firebase-app.token';

export function provideFirebaseApp(config: FirebaseOptions): EnvironmentProviders {
  const app = initializeApp(config);

  return makeEnvironmentProviders([
    {
      provide: FIREBASE_APP,
      useValue: app,
    },
  ]);
}
