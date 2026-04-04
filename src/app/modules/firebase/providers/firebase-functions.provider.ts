import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { FirebaseApp } from 'firebase/app';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { environment } from 'src/environments/environment';
import { FIREBASE_APP } from '../tokens/firebase-app.token';
import { FIREBASE_FUNCTIONS } from '../tokens/firebase-functions.token';

export function provideFirebaseFunctions(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: FIREBASE_FUNCTIONS,
      useFactory: (app: FirebaseApp) => {
        const functions = getFunctions(app);
        if (environment.type === 'developmentFunc') {
          connectFunctionsEmulator(functions, 'localhost', 5001);
        }
        return functions;
      },
      deps: [FIREBASE_APP],
    },
  ]);
}
