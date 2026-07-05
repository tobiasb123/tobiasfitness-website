import { Booking } from '@models/booking/interfaces';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  deleteBookingAction,
  loadBookingsAction,
  loadBookingsFailAction,
  loadBookingSuccessAction,
  newBookingAction,
  updateBookingAction,
} from './booking.actions';

export interface BookingState extends EntityState<Booking> {
  loading: boolean;
  loaded: boolean;
  error: string;
}

export const bookingAdapter = createEntityAdapter<Booking>({
  selectId: (booking: Booking) => booking.id,
});

const initialState: BookingState = bookingAdapter.getInitialState({
  loading: false,
  loaded: false,
  error: null,
});

export const bookingReducer = createReducer(
  initialState,
  on(loadBookingsAction, (state) => ({
    ...state,
    loading: true,
    loaded: false,
    error: null as string,
  })),
  on(loadBookingSuccessAction, (state, action) =>
    bookingAdapter.setAll(action.bookings, {
      ...state,
      loading: false,
      loaded: true,
    }),
  ),
  on(loadBookingsFailAction, (state, action) => ({
    ...state,
    loading: false,
    error: action.error,
  })),
  on(newBookingAction, (state, action) =>
    bookingAdapter.addOne(action.booking, {
      ...state,
    }),
  ),
  on(updateBookingAction, (state, action) =>
    bookingAdapter.updateOne(action.booking, {
      ...state,
    }),
  ),
  on(deleteBookingAction, (state, action) =>
    bookingAdapter.removeOne(action.id, {
      ...state,
    }),
  ),
);
