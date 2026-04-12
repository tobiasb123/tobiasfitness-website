import { inject, Injectable, Injector, runInInjectionContext, signal } from '@angular/core';
import { AUTH_STATE } from '../../tokens/auth-state.token';
import { FirebaseService } from '@modules/firebase';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  User,
  UserCredential,
} from 'firebase/auth';
import { UserProfile } from '@models/auth';
import { getFirebaseError } from '@modules/core';
import { Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class AuthFunctionsService {
  private authState = inject(AUTH_STATE);
  private firebaseService = inject(FirebaseService);
  private auth = this.firebaseService.getAuth();
  private router = inject(Router);
  private injector = inject(Injector);

  private updateEmailFunc = this.firebaseService.httpsCallable<
    {
      idToken: string;
      newEmail: string;
    },
    UserProfile
  >('auth-updateEmail');
  private updatePasswordFunc = this.firebaseService.httpsCallable<
    { idToken: string; newPassword: string },
    void
  >('auth-updatePassword');

  public currentUser = signal<User>(undefined);
  public currentUserProfile = signal<UserProfile>(undefined);

  public initialize(): void {
    this.auth.onIdTokenChanged((user) => {
      this.currentUser.set(user);
      this.authState.set(user ? 'loggedIn' : 'ready');
    });
  }

  public async signUp(email: string, password: string): Promise<User> {
    return await createUserWithEmailAndPassword(this.auth, email, password)
      .then((userCred) => userCred.user)
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

  public async updateEmail(
    user: User,
    newEmail: string,
    currentPassword: string,
  ): Promise<UserProfile> {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    return await reauthenticateWithCredential(user, credential)
      .then(async (userCredential) => {
        return await this.updateEmailFunc({
          idToken: await userCredential.user.getIdToken(),
          newEmail: newEmail,
        }).then((result) => result.data);
      })
      .catch((error) => {
        throw getFirebaseError(error);
      });
  }

  public async updatePassword(
    user: User,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    return await reauthenticateWithCredential(user, credential)
      .then(async (userCredential) => {
        return await this.updatePasswordFunc({
          idToken: await userCredential.user.getIdToken(),
          newPassword: newPassword,
        }).then((result) => result.data);
      })
      .catch((error) => {
        throw getFirebaseError(error);
      });
  }
}
