import { Service } from '@models/booking/interfaces';
import { createAction, props } from '@ngrx/store';

export const loadServicesAction = createAction('[Services] Load Services');

export const loadServicesSuccessAction = createAction(
  '[Services] Load Services Success',
  props<{ services: Service[] }>(),
);

export const loadServicesFailAction = createAction(
  '[Services] Load Services Fail',
  props<{ error: string }>(),
);
