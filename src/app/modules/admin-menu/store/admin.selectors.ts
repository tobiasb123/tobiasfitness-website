import { createFeatureSelector, createSelector } from '@ngrx/store';
import { adminAdapter, AdminState } from './admin.reducer';

export const adminFeature = 'admin';

export const selectAdminFeature = createFeatureSelector<AdminState>(adminFeature);

export const selectLoadingUsers = createSelector(selectAdminFeature, (state) => state.loading);

export const selectLoadedUsers = createSelector(selectAdminFeature, (state) => state.loaded);

export const selectLoadingUsersError = createSelector(selectAdminFeature, (state) => state.error);

const { selectAll } = adminAdapter.getSelectors();

export const selectUsers = createSelector(selectAdminFeature, selectAll);
