import { createFeatureSelector, createSelector } from '@ngrx/store';
import { bookingAdapter, BookingState } from './booking.reducer';

export const bookingFeature = 'booking';

export const selectBookingFeature = createFeatureSelector<BookingState>(bookingFeature);

export const selectLoadingBookings = createSelector(selectBookingFeature, (state) => state.loading);

export const selectLoadedBookings = createSelector(selectBookingFeature, (state) => state.loaded);

export const selectLoadingBookingsError = createSelector(
  selectBookingFeature,
  (state) => state.error,
);

const { selectAll } = bookingAdapter.getSelectors();

export const selectBookings = createSelector(selectBookingFeature, selectAll);
