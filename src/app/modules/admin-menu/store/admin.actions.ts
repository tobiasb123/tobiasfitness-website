import { UserProfile } from '@models/auth/interfaces';
import { Booking } from '@models/booking/interfaces';
import { createAction, props } from '@ngrx/store';

export const loadUsersAction = createAction('[Admin] Load Users');

export const loadUsersSuccessAction = createAction(
  '[Admin] Load Users Success',
  props<{ users: UserProfile[] }>(),
);

export const loadUsersFailAction = createAction(
  '[Admin] Load Users Fail',
  props<{ error: string }>(),
);

export const editBookingRequestAction = createAction(
  '[Admin] Edit Booking Request',
  props<{ booking: Booking }>(),
);

export const editBookingSuccessAction = createAction('[Admin] Edit Booking Success');

export const editBookingFailAction = createAction(
  '[Admin] Edit Booking Fail',
  props<{ error: string }>(),
);

export const deleteBookingRequestAction = createAction(
  '[Admin] Delete Booking Request',
  props<{ id: string }>(),
);

export const deleteBookingSuccessAction = createAction('[Admin] Delete Booking Success');

export const deleteBookingFailAction = createAction(
  '[Admin] Delete Booking Fail',
  props<{ error: string }>(),
);

export const clearBookingCommandStateAction = createAction('[Admin] Clear Booking Command State');
