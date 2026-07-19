import { inject, Injectable } from '@angular/core';
import { UserProfile } from '@models/auth/interfaces';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
  clearAuthProfileAction,
  loadAuthProfileAction,
  setAuthProfileAction,
  updateAuthProfileAction,
} from './auth-profile.actions';
import {
  selectAuthProfile,
  selectAuthProfileError,
  selectAuthProfileLoading,
  selectAuthProfileUpdateError,
  selectAuthProfileUpdating,
} from './auth-profile.selectors';
import { logoutAction } from './auth.actions';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private store = inject(Store);

  public currentProfile = this.store.selectSignal(selectAuthProfile);

  public logout(): void {
    this.store.dispatch(logoutAction());
  }

  public loadAuthProfile(): void {
    this.store.dispatch(loadAuthProfileAction());
  }

  public clearAuthProfile(): void {
    this.store.dispatch(clearAuthProfileAction());
  }

  public setAuthProfile(profile: UserProfile): void {
    this.store.dispatch(setAuthProfileAction({ profile }));
  }

  public updateAuthProfile(updates: Partial<UserProfile>): void {
    this.store.dispatch(updateAuthProfileAction({ updates }));
  }

  public isAuthProfileLoading(): Observable<boolean> {
    return this.store.select(selectAuthProfileLoading);
  }

  public getAuthProfileError(): Observable<string> {
    return this.store.select(selectAuthProfileError);
  }

  public isAuthProfileUpdating(): Observable<boolean> {
    return this.store.select(selectAuthProfileUpdating);
  }

  public getAuthProfileUpdateError(): Observable<string> {
    return this.store.select(selectAuthProfileUpdateError);
  }
}
