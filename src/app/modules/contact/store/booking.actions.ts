import { Booking } from '@models/booking/interfaces';
import { Update } from '@ngrx/entity';
import { createAction, props } from '@ngrx/store';

export const loadBookingsAction = createAction('[Booking] Load Bookings');

export const loadBookingSuccessAction = createAction(
  '[Booking] Load Bookings Success',
  props<{ bookings: Booking[] }>(),
);

export const loadBookingsFailAction = createAction(
  '[Booking] Load Bookings Fail',
  props<{ error: string }>(),
);

export const newBookingAction = createAction(
  '[Booking] New Booking',
  props<{ booking: Booking }>(),
);

export const updateBookingAction = createAction(
  '[Booking] Update Booking',
  props<{ booking: Update<Booking> }>(),
);

export const deleteBookingAction = createAction(
  '[Booking] Delete Booking',
  props<{ id: string }>(),
);
