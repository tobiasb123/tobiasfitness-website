import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { FirebaseError } from 'firebase/app';
import { catchError, exhaustMap, map, mergeMap, of } from 'rxjs';
import { deleteBookingAction, updateBookingAction } from '../../contact/store/booking.actions';
import { AdminFunctionsService } from '../services/admin-functions.service';
import {
  deleteBookingFailAction,
  deleteBookingRequestAction,
  deleteBookingSuccessAction,
  editBookingFailAction,
  editBookingRequestAction,
  editBookingSuccessAction,
  loadUsersAction,
  loadUsersFailAction,
  loadUsersSuccessAction,
} from './admin.actions';

@Injectable()
export class AdminEffects {
  private actions = inject(Actions);
  private adminFunctions = inject(AdminFunctionsService);

  loadUsers = createEffect(() =>
    this.actions.pipe(
      ofType(loadUsersAction),
      exhaustMap(() => this.adminFunctions.getUsers()),
      map((users) => loadUsersSuccessAction({ users: users })),
      catchError((error: FirebaseError) => of(loadUsersFailAction({ error: error.message }))),
    ),
  );

  editBooking = createEffect(() =>
    this.actions.pipe(
      ofType(editBookingRequestAction),
      exhaustMap((action) =>
        this.adminFunctions
          .editBooking(action.booking)
          .then(() => action.booking)
          .then((booking) => booking),
      ),
      mergeMap((booking) => [
        updateBookingAction({
          booking: {
            id: booking.id,
            changes: {
              date: booking.date,
              service: booking.service,
              timePeriod: booking.timePeriod,
            },
          },
        }),
        editBookingSuccessAction(),
      ]),
      catchError((error: FirebaseError) => of(editBookingFailAction({ error: error.message }))),
    ),
  );

  deleteBooking = createEffect(() =>
    this.actions.pipe(
      ofType(deleteBookingRequestAction),
      exhaustMap((action) =>
        this.adminFunctions
          .deleteBooking(action.id)
          .then(() => action.id)
          .then((id) => id),
      ),
      mergeMap((id) => [deleteBookingAction({ id }), deleteBookingSuccessAction()]),
      catchError((error: FirebaseError) => of(deleteBookingFailAction({ error: error.message }))),
    ),
  );
}
