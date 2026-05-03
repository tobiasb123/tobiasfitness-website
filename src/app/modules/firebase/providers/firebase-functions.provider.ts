import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { environment } from '@environments';
import { FIREBASE_FUNCTIONS_BASE_URL } from '../tokens/firebase-functions-base-url.token';

const FUNCTIONS_REGION = 'us-central1';
const FIREBASE_PROJECT_ID = 'tobiasbastholmfitness';

export function provideFirebaseFunctions(): EnvironmentProviders {
  const isEmulator = environment.type === 'developmentFunc';

  return makeEnvironmentProviders([
    {
      provide: FIREBASE_FUNCTIONS_BASE_URL,
      useValue: isEmulator
        ? `http://localhost:5001/${FIREBASE_PROJECT_ID}/${FUNCTIONS_REGION}`
        : `https://${FUNCTIONS_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net`,
    },
  ]);
}
