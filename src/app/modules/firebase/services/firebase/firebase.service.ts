import { inject, Injectable } from '@angular/core';
import { FIREBASE_AUTH } from '../../tokens/firebase-auth.token';
import { FIREBASE_FUNCTIONS } from '../../tokens/firebase-functions.token';
import { Auth } from 'firebase/auth';
import { httpsCallable, HttpsCallable } from 'firebase/functions';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private auth = inject(FIREBASE_AUTH);
  private functions = inject(FIREBASE_FUNCTIONS);

  getAuth(): Auth {
    return this.auth;
  }

  httpsCallable<TData, TResult>(name: string): HttpsCallable<TData, TResult> {
    return httpsCallable(this.functions, name);
  }
}
