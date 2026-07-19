import { UserProfile } from '@models/auth/interfaces';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  clearBookingCommandStateAction,
  deleteBookingFailAction,
  deleteBookingRequestAction,
  deleteBookingSuccessAction,
  editBookingFailAction,
  editBookingRequestAction,
  editBookingSuccessAction,
  loadUsersAction,
  loadUsersFailAction,
  loadUsersSuccessAction,
} from './admin.actions';

export type AdminBookingCommandType = 'edit' | 'delete' | null;

export interface AdminState extends EntityState<UserProfile> {
  loading: boolean;
  loaded: boolean;
  error: string;
  commandLoading: boolean;
  commandCompleted: boolean;
  commandType: AdminBookingCommandType;
  commandError: string;
}

export const adminAdapter = createEntityAdapter<UserProfile>({
  selectId: (user: UserProfile) => user.uid,
});

const initialState: AdminState = adminAdapter.getInitialState({
  loaded: false,
  loading: false,
  error: null,
  commandLoading: false,
  commandCompleted: false,
  commandType: null,
  commandError: null,
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
  on(editBookingRequestAction, (state) => ({
    ...state,
    commandLoading: true,
    commandCompleted: false,
    commandType: 'edit' as AdminBookingCommandType,
    commandError: null as string,
  })),
  on(editBookingSuccessAction, (state) => ({
    ...state,
    commandLoading: false,
    commandCompleted: true,
    commandType: 'edit' as AdminBookingCommandType,
    commandError: null as string,
  })),
  on(editBookingFailAction, (state, action) => ({
    ...state,
    commandLoading: false,
    commandCompleted: true,
    commandType: 'edit' as AdminBookingCommandType,
    commandError: action.error,
  })),
  on(deleteBookingRequestAction, (state) => ({
    ...state,
    commandLoading: true,
    commandCompleted: false,
    commandType: 'delete' as AdminBookingCommandType,
    commandError: null as string,
  })),
  on(deleteBookingSuccessAction, (state) => ({
    ...state,
    commandLoading: false,
    commandCompleted: true,
    commandType: 'delete' as AdminBookingCommandType,
    commandError: null as string,
  })),
  on(deleteBookingFailAction, (state, action) => ({
    ...state,
    commandLoading: false,
    commandCompleted: true,
    commandType: 'delete' as AdminBookingCommandType,
    commandError: action.error,
  })),
  on(clearBookingCommandStateAction, (state) => ({
    ...state,
    commandLoading: false,
    commandCompleted: false,
    commandType: null as AdminBookingCommandType,
    commandError: null as string,
  })),
);
