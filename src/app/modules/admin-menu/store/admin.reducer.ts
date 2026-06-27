import { UserProfile } from '@models/auth/interfaces';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { loadUsersAction, loadUsersFailAction, loadUsersSuccessAction } from './admin.actions';

export interface AdminState extends EntityState<UserProfile> {
  loading: boolean;
  loaded: boolean;
  error: string;
}

export const adminAdapter = createEntityAdapter<UserProfile>({
  selectId: (user: UserProfile) => user.uid,
});

const initialState: AdminState = adminAdapter.getInitialState({
  loaded: false,
  loading: false,
  error: null,
});

export const adminReducer = createReducer(
  initialState,
  on(loadUsersAction, (state) => ({
    ...state,
    loading: true,
    loaded: false,
    error: null as string,
  })),
  on(loadUsersSuccessAction, (state, action) =>
    adminAdapter.setAll(action.users, {
      ...state,
      loading: false,
      loaded: true,
    }),
  ),
  on(loadUsersFailAction, (state, action) => ({
    ...state,
    loading: false,
    error: action.error,
  })),
);
