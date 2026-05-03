import { inject, Injectable, Injector, runInInjectionContext, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { BaseProfile, UserProfile } from '@models/auth';
import { Address } from '@models/auth/interfaces/address.interface';
import { getFirebaseError } from '@modules/core';
import { FirebaseService } from '@modules/firebase';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  User,
} from 'firebase/auth';
import { map, Observable } from 'rxjs';
import { AUTH_STATE } from '../../tokens/auth-state.token';

@Injectable({
  providedIn: 'root',
})
export class AuthFunctionsService {
  private authState = inject(AUTH_STATE);
  private firebaseService = inject(FirebaseService);
  private auth = this.firebaseService.getAuth();
  private router = inject(Router);
  private injector = inject(Injector);

  public currentUserProfile = signal<UserProfile>(undefined);

  public initialize(): void {
    this.auth.onIdTokenChanged((user) => {
      if (user) {
        this.firebaseService.httpGet<UserProfile>('auth-getUserProfile').then((userProfile) => {
          this.currentUserProfile.set(userProfile);
          this.authState.set('loggedIn');
        });
      } else {
        this.currentUserProfile.set(undefined);
        this.authState.set('ready');
      }
    });
  }

  public async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    address: Address,
  ): Promise<UserProfile> {
    return await createUserWithEmailAndPassword(this.auth, email, password)
      .then(async () => {
        const profile: BaseProfile = {
          firstName: firstName,
          lastName: lastName,
          phoneNumber: phoneNumber,
          address: address,
        };

        return await this.firebaseService.httpPost<BaseProfile, UserProfile>(
          'auth-register',
          profile,
        );
      })
      .catch((error) => {
        throw getFirebaseError(error);
      });
  }

  public async signIn(email: string, password: string, rememberMe: boolean): Promise<User> {
    return setPersistence(
      this.auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence,
    )
      .then(async () => {
        return await signInWithEmailAndPassword(this.auth, email, password)
          .then((userCred) => userCred.user)
          .catch((error) => {
            this.authState.set('ready');
            throw getFirebaseError(error);
          });
      })
      .catch((error) => {
        this.authState.set('ready');
        throw getFirebaseError(error);
      });
  }

  public async sendPasswordResetEmail(email: string): Promise<void> {
    return await sendPasswordResetEmail(this.auth, email).catch((error) => {
      throw getFirebaseError(error);
    });
  }

  public async logout(): Promise<void> {
    this.router.navigate(['']);

    return await this.auth.signOut().catch((error) => {
      throw getFirebaseError(error);
    });
  }

  public isLoggedIn(): Observable<boolean> {
    return runInInjectionContext(this.injector, () =>
      toObservable(this.authState).pipe(map((state) => state === 'loggedIn')),
    );
  }

  public async updateDetails(updates: Partial<UserProfile>): Promise<void> {
    return await this.firebaseService.httpPost<Partial<UserProfile>, void>(
      'auth-updateDetails',
      updates,
    );
  }
}
