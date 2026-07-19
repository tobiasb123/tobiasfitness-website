import { createFeatureSelector, createSelector } from '@ngrx/store';
import { adminAdapter, AdminState } from './admin.reducer';

export const adminFeature = 'admin';

export const selectAdminFeature = createFeatureSelector<AdminState>(adminFeature);

export const selectLoadingUsers = createSelector(selectAdminFeature, (state) => state.loading);

export const selectLoadedUsers = createSelector(selectAdminFeature, (state) => state.loaded);

export const selectLoadingUsersError = createSelector(selectAdminFeature, (state) => state.error);

export const selectAdminBookingCommandLoading = createSelector(
  selectAdminFeature,
  (state) => state.commandLoading,
);

export const selectAdminBookingCommandCompleted = createSelector(
  selectAdminFeature,
  (state) => state.commandCompleted,
);

export const selectAdminBookingCommandType = createSelector(
  selectAdminFeature,
  (state) => state.commandType,
);

export const selectAdminBookingCommandError = createSelector(
  selectAdminFeature,
  (state) => state.commandError,
);

const { selectAll } = adminAdapter.getSelectors();

export const selectUsers = createSelector(selectAdminFeature, selectAll);
