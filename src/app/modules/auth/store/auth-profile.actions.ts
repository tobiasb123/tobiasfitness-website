import { UserProfile } from '@models/auth/interfaces';
import { createAction, props } from '@ngrx/store';

export const loadAuthProfileAction = createAction('[Auth Profile] Load Auth Profile');

export const loadAuthProfileSuccessAction = createAction(
  '[Auth Profile] Load Auth Profile Success',
  props<{ profile: UserProfile }>(),
);

export const loadAuthProfileFailAction = createAction(
  '[Auth Profile] Load Auth Profile Fail',
  props<{ error: string }>(),
);

export const setAuthProfileAction = createAction(
  '[Auth Profile] Set Auth Profile',
  props<{ profile: UserProfile }>(),
);

export const clearAuthProfileAction = createAction('[Auth Profile] Clear Auth Profile');

export const updateAuthProfileAction = createAction(
  '[Auth Profile] Update Auth Profile',
  props<{ updates: Partial<UserProfile> }>(),
);

export const updateAuthProfileSuccessAction = createAction(
  '[Auth Profile] Update Auth Profile Success',
  props<{ updates: Partial<UserProfile> }>(),
);

export const updateAuthProfileFailAction = createAction(
  '[Auth Profile] Update Auth Profile Fail',
  props<{ error: string }>(),
);
