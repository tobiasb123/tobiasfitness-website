import { ActionReducer, INIT } from '@ngrx/store';
import { logoutAction } from './auth.actions';

export const logoutReducer = (reducer: ActionReducer<any>): ActionReducer<any> => {
  return (state, action) => {
    if (action?.type === logoutAction.type) {
      return reducer(undefined, { type: INIT });
    }

    return reducer(state, action);
  };
};
