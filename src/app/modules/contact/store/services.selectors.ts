import { createFeatureSelector, createSelector } from '@ngrx/store';
import { servicesAdapter, ServicesState } from './services.reducer';

export const servicesFeature = 'services';

export const selectServicesFeature = createFeatureSelector<ServicesState>(servicesFeature);

export const selectLoadingServices = createSelector(
  selectServicesFeature,
  (state) => state.loading,
);

export const selectLoadedServices = createSelector(selectServicesFeature, (state) => state.loaded);

export const selectLoadingServicesError = createSelector(
  selectServicesFeature,
  (state) => state.error,
);

export interface ServiceUpdateState {
  updatingServiceId: string | null;
  updateError: string;
  updateErrorServiceId: string | null;
  lastUpdatedServiceId: string | null;
}

export const selectServiceUpdateState = createSelector(
  selectServicesFeature,
  (state): ServiceUpdateState => ({
    updatingServiceId: state.updatingServiceId,
    updateError: state.updateError,
    updateErrorServiceId: state.updateErrorServiceId,
    lastUpdatedServiceId: state.lastUpdatedServiceId,
  }),
);

const { selectAll } = servicesAdapter.getSelectors();

export const selectServices = createSelector(selectServicesFeature, selectAll);
