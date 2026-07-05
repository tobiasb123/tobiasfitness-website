import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { FirebaseError } from 'firebase/app';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { loadUsersFailAction } from '../../admin-menu/store/admin.actions';
import { ContactFunctionsService } from '../services/contact-functions/contact-functions.service';
import { loadBookingsAction, loadBookingSuccessAction } from './booking.actions';

@Injectable()
export class BookingEffects {
  private actions = inject(Actions);
  private bookingFunctions = inject(ContactFunctionsService);

  loadBookings = createEffect(() =>
    this.actions.pipe(
      ofType(loadBookingsAction),
      exhaustMap(() => this.bookingFunctions.getBookings()),
      map((bookings) => loadBookingSuccessAction({ bookings: bookings })),
      catchError((error: FirebaseError) => of(loadUsersFailAction({ error: error.message }))),
    ),
  );
}
