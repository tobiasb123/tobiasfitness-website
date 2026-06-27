import { UserProfile } from '@models/auth/interfaces';
import { createAction, props } from '@ngrx/store';

export const loadUsersAction = createAction('[Admin] Load Users');

export const loadUsersSuccessAction = createAction(
  '[Admin] Load Users Success',
  props<{ users: UserProfile[] }>(),
);

export const loadUsersFailAction = createAction(
  '[Admin] Load Users Fail',
  props<{ error: string }>(),
);
