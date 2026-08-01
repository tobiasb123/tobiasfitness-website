import { effect, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BaseProfile, UserProfile } from '@models/auth/interfaces';
import { Address } from '@models/auth/interfaces/address.interface';
import { getFirebaseError, ToastService } from '@modules/core';
import { FirebaseService } from '@modules/firebase';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  Unsubscribe,
  User,
} from 'firebase/auth';
import { AuthFacade } from '../../store/auth.facade';
import { AUTH_STATE } from '../../tokens/auth-state.token';

@Injectable({
  providedIn: 'root',
})
export class AuthFunctionsService {
  private authState = inject(AUTH_STATE);
  private firebaseService = inject(FirebaseService);
  private auth = this.firebaseService.getAuth();
  private router = inject(Router);
  private authFacade = inject(AuthFacade);
  private toastService = inject(ToastService);
  private idTokenListener: Unsubscribe;

  public currentUserProfile = signal<UserProfile>(undefined);

  private readonly profileEffect = effect(() => {
    const profile = this.authFacade.currentProfile();

    this.currentUserProfile.set(profile ?? undefined);

    if (profile?.uid) {
      this.authState.set('loggedIn');
    }
  });

  public initialize(): void {
    this.idTokenListener = this.auth.onIdTokenChanged((user) => {
      if (user) {
        this.authFacade.loadAuthProfile();
      } else {
        this.currentUserProfile.set(undefined);
        this.authFacade.clearAuthProfile();
        this.authState.set('ready');
      }
    });
  }

  private uninitialize(): void {
    this.idTokenListener();
    this.idTokenListener = undefined;
  }

  public async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    age: number,
    phoneNumber: string,
    address: Address,
  ): Promise<UserProfile> {
    this.uninitialize();

    return await createUserWithEmailAndPassword(this.auth, email, password)
      .then(async () => {
        const profile: BaseProfile = {
          firstName: firstName,
          lastName: lastName,
          age: age,
          phoneNumber: phoneNumber,
          address: address,
        };

        const user = await this.firebaseService.httpPost<BaseProfile, UserProfile>(
          'auth-register',
          profile,
        );

        this.authFacade.setAuthProfile(user);
        this.initialize();
        return user;
      })
      .catch((error) => {
        this.initialize();
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

    return await this.auth
      .signOut()
      .then(() => {
        this.authFacade.logout();
        this.toastService.open('Du er blevet logged ud', 'info');
      })
      .catch((error) => {
        throw getFirebaseError(error);
      });
  }

  public async updateDetails(updates: Partial<UserProfile>): Promise<Partial<UserProfile>> {
    const updatedProfile = await this.firebaseService.httpPost<
      Partial<UserProfile>,
      Partial<UserProfile>
    >('auth-updateDetails', updates);

    const currentProfile = this.currentUserProfile();
    const mergedProfile = {
      ...currentProfile,
      ...updatedProfile,
      address: updatedProfile.address ?? currentProfile?.address,
    } as UserProfile;

    this.currentUserProfile.set(mergedProfile);
    this.authFacade.setAuthProfile(mergedProfile);

    return updatedProfile;
  }
}
