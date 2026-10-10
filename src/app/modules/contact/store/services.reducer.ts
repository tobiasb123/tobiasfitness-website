import { Service } from '@models/booking/interfaces';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  createServiceSuccessAction,
  deleteServiceAction,
  deleteServiceSuccessAction,
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
  updatingServiceId: null as string | null,
  updateError: '',
  updateErrorServiceId: null as string | null,
  lastUpdatedServiceId: null as string | null,
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
    updateErrorServiceId: null as string | null,
    lastUpdatedServiceId: null as string | null,
  })),
  on(updateServiceSuccessAction, (state, action) =>
    servicesAdapter.updateOne(
      { id: action.service.id, changes: action.service },
      {
        ...state,
        updatingServiceId: null as string | null,
        updateError: '',
        updateErrorServiceId: null as string | null,
        lastUpdatedServiceId: action.service.id,
      },
    ),
  ),
  on(createServiceSuccessAction, (state, action) =>
    servicesAdapter.addOne(action.service, {
      ...state,
      updatingServiceId: null as string | null,
      updateError: '',
      updateErrorServiceId: null as string | null,
      lastUpdatedServiceId: action.service.id,
    }),
  ),
  on(deleteServiceAction, (state, action) => ({
    ...state,
    updatingServiceId: action.serviceId,
    updateError: '',
    updateErrorServiceId: null as string | null,
    lastUpdatedServiceId: null as string | null,
  })),
  on(deleteServiceSuccessAction, (state, action) =>
    servicesAdapter.removeOne(action.serviceId, {
      ...state,
      updatingServiceId: null as string | null,
      lastUpdatedServiceId: action.serviceId,
    }),
  ),
  on(updateServiceFailAction, (state, action) => ({
    ...state,
    updatingServiceId: null as string | null,
    updateError: action.error,
    updateErrorServiceId: action.serviceId,
    lastUpdatedServiceId: null as string | null,
  })),
);
