import { inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { UserProfile } from '@models/auth/interfaces';
import { Booking } from '@models/booking/interfaces';
import { AuthFunctionsService } from '@modules/auth';
import { Store } from '@ngrx/store';
import { combineLatest, filter, Observable, switchMap, tap } from 'rxjs';
import {
  clearBookingCommandStateAction,
  deleteBookingRequestAction,
  editBookingRequestAction,
  loadUsersAction,
} from './admin.actions';
import {
  selectAdminBookingCommandCompleted,
  selectAdminBookingCommandError,
  selectAdminBookingCommandLoading,
  selectAdminBookingCommandType,
  selectAdminFeature,
  selectUsers,
} from './admin.selectors';

@Injectable({ providedIn: 'root' })
export class AdminFacade {
  private store = inject(Store);
  private authFunctions = inject(AuthFunctionsService);
  private currentUserProfile$ = toObservable(this.authFunctions.currentUserProfile);

  public getUsers(): Observable<UserProfile[]> {
    return combineLatest([this.store.select(selectAdminFeature), this.currentUserProfile$]).pipe(
      filter(([, profile]) => !!profile?.admin),
      tap(([state]) => {
        if (!state.loaded && !state.loading) {
          this.store.dispatch(loadUsersAction());
        }
      }),
      filter(([state]) => state.loaded),
      switchMap(() => this.store.select(selectUsers)),
    );
  }

  public editBooking(booking: Booking): void {
    this.store.dispatch(editBookingRequestAction({ booking }));
  }

  public deleteBooking(id: string): void {
    this.store.dispatch(deleteBookingRequestAction({ id }));
  }

  public clearBookingCommandState(): void {
    this.store.dispatch(clearBookingCommandStateAction());
  }

  public isBookingCommandLoading(): Observable<boolean> {
    return this.store.select(selectAdminBookingCommandLoading);
  }

  public getBookingCommandError(): Observable<string> {
    return this.store.select(selectAdminBookingCommandError);
  }

  public isBookingCommandCompleted(): Observable<boolean> {
    return this.store.select(selectAdminBookingCommandCompleted);
  }

  public getBookingCommandType(): Observable<'edit' | 'delete' | null> {
    return this.store.select(selectAdminBookingCommandType);
  }
}
