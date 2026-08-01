import { UserProfile } from '@models/auth/interfaces';
import { createReducer, on } from '@ngrx/store';
import {
  clearAuthProfileAction,
  loadAuthProfileAction,
  loadAuthProfileFailAction,
  loadAuthProfileSuccessAction,
  setAuthProfileAction,
  updateAuthProfileAction,
  updateAuthProfileFailAction,
  updateAuthProfileSuccessAction,
} from './auth-profile.actions';

export interface AuthProfileState {
  profile: UserProfile | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  updating: boolean;
  updateError: string | null;
}

const initialState: AuthProfileState = {
  profile: null,
  loading: false,
  loaded: false,
  error: null,
  updating: false,
  updateError: null,
};

export const authProfileReducer = createReducer(
  initialState,
  on(loadAuthProfileAction, (state) => ({
    ...state,
    loading: true,
    loaded: false,
    error: null,
  })),
  on(loadAuthProfileSuccessAction, (state, action) => ({
    ...state,
    loading: false,
    loaded: true,
    profile: action.profile,
    error: null,
  })),
  on(loadAuthProfileFailAction, (state, action) => ({
    ...state,
    loading: false,
    loaded: false,
    profile: null,
    error: action.error,
  })),
  on(setAuthProfileAction, (state, action) => ({
    ...state,
    profile: action.profile,
    loaded: true,
    loading: false,
    error: null,
  })),
  on(clearAuthProfileAction, () => ({
    ...initialState,
  })),
  on(updateAuthProfileAction, (state) => ({
    ...state,
    updating: true,
    updateError: null,
  })),
  on(updateAuthProfileSuccessAction, (state, action) => ({
    ...state,
    profile: state.profile
      ? {
          ...state.profile,
          ...action.updates,
          address: action.updates.address ?? state.profile.address,
        }
      : (action.updates as UserProfile),
    updating: false,
    updateError: null,
  })),
  on(updateAuthProfileFailAction, (state, action) => ({
    ...state,
    updating: false,
    updateError: action.error,
  })),
);
