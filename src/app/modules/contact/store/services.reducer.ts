import { Service } from '@models/booking/interfaces';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  loadServicesAction,
  loadServicesFailAction,
  loadServicesSuccessAction,
  updateServiceFailAction,
  updateServiceStartedAction,
  updateServiceSuccessAction,
} from './services.actions';

export interface ServicesState extends EntityState<Service> {
  loading: boolean;
  loaded: boolean;
  error: string;
  updatingServiceId: string | null;
  updateError: string;
  updateErrorServiceId: string | null;
  lastUpdatedServiceId: string | null;
}

export const servicesAdapter = createEntityAdapter<Service>({
  selectId: (service: Service) => service.id,
});

const initialState = servicesAdapter.getInitialState<ServicesState>({
  loading: false,
  loaded: false,
  error: '',
  updatingServiceId: null,
  updateError: '',
  updateErrorServiceId: null,
  lastUpdatedServiceId: null,
});

export const servicesReducer = createReducer(
  initialState,
  on(loadServicesAction, (state) => ({
    ...state,
    loading: true,
    loaded: false,
    error: null as string,
  })),
  on(loadServicesSuccessAction, (state, action) =>
    servicesAdapter.setAll(action.services, {
      ...state,
      loading: false,
      loaded: true,
    }),
  ),
  on(loadServicesFailAction, (state, action) => ({
    ...state,
    loading: false,
    error: action.error,
  })),
  on(updateServiceStartedAction, (state, action) => ({
    ...state,
    updatingServiceId: action.serviceId,
    updateError: '',
    updateErrorServiceId: null,
    lastUpdatedServiceId: null,
  })),
  on(updateServiceSuccessAction, (state, action) =>
    servicesAdapter.updateOne(
      { id: action.service.id, changes: action.service },
      {
        ...state,
        updatingServiceId: null,
        updateError: '',
        updateErrorServiceId: null,
        lastUpdatedServiceId: action.service.id,
      },
    ),
  ),
  on(updateServiceFailAction, (state, action) => ({
    ...state,
    updatingServiceId: null,
    updateError: action.error,
    updateErrorServiceId: action.serviceId,
    lastUpdatedServiceId: null,
  })),
);
