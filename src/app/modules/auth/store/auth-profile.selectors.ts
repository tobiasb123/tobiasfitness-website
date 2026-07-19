import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthProfileState } from './auth-profile.reducer';

export const authProfileFeature = 'authProfile';

export const selectAuthProfileFeature = createFeatureSelector<AuthProfileState>(authProfileFeature);

export const selectAuthProfile = createSelector(selectAuthProfileFeature, (state) => state.profile);

export const selectAuthProfileLoading = createSelector(
  selectAuthProfileFeature,
  (state) => state.loading,
);

export const selectAuthProfileLoaded = createSelector(
  selectAuthProfileFeature,
  (state) => state.loaded,
);

export const selectAuthProfileError = createSelector(
  selectAuthProfileFeature,
  (state) => state.error,
);

export const selectAuthProfileUpdating = createSelector(
  selectAuthProfileFeature,
  (state) => state.updating,
);

export const selectAuthProfileUpdateError = createSelector(
  selectAuthProfileFeature,
  (state) => state.updateError,
);
