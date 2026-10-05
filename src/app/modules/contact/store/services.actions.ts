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

export const updateServiceStartedAction = createAction(
  '[Services] Update Service Started',
  props<{ serviceId: string }>(),
);

export const updateServiceAction = createAction(
  '[Services] Update Service',
  props<{ service: Service }>(),
);

export const updateServiceSuccessAction = createAction(
  '[Services] Update Service Success',
  props<{ service: Service }>(),
);

export const updateServiceFailAction = createAction(
  '[Services] Update Service Fail',
  props<{ serviceId: string; error: string }>(),
);
