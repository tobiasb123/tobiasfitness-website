import { Service } from '@models/booking/interfaces';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  loadServicesAction,
  loadServicesFailAction,
  loadServicesSuccessAction,
} from './services.actions';

export interface ServicesState extends EntityState<Service> {
  loading: boolean;
  loaded: boolean;
  error: string;
}

export const servicesAdapter = createEntityAdapter<Service>({
  selectId: (service: Service) => service.id,
});

const initialState: ServicesState = servicesAdapter.getInitialState({
  loading: false,
  loaded: false,
  error: null,
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
);
