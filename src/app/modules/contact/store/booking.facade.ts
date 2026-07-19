import { inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Booking } from '@models/booking/interfaces';
import { AUTH_STATE } from '@modules/auth';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { combineLatest, filter, Observable, switchMap, tap } from 'rxjs';
import {
  deleteBookingAction,
  loadBookingsAction,
  newBookingAction,
  updateBookingAction,
} from './booking.actions';
import { selectBookingFeature, selectBookings } from './booking.selectors';

@Injectable({ providedIn: 'root' })
export class BookingFacade {
  private store = inject(Store);
  private authState = inject(AUTH_STATE);
  private authState$ = toObservable(this.authState);

  public getBookings(): Observable<Booking[]> {
    return combineLatest([this.store.select(selectBookingFeature), this.authState$]).pipe(
      filter(([, authState]) => authState === 'loggedIn'),
      tap(([state]) => {
        if (!state.loaded && !state.loading) {
          this.store.dispatch(loadBookingsAction());
        }
      }),
      filter(([state]) => state.loaded),
      switchMap(() => this.store.select(selectBookings)),
    );
  }

  public newBooking(booking: Booking): void {
    this.store.dispatch(newBookingAction({ booking: booking }));
  }

  public updateBooking(booking: Booking): void {
    const update: Update<Booking> = {
      id: booking.id,
      changes: {
        date: booking.date,
        timePeriod: booking.timePeriod,
        service: booking.service,
      },
    };

    this.store.dispatch(updateBookingAction({ booking: update }));
  }

  public deleteBooking(id: string): void {
    this.store.dispatch(deleteBookingAction({ id: id }));
  }
}
