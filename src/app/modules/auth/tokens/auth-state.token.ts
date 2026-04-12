import { InjectionToken, WritableSignal } from '@angular/core';
import { AuthState } from '../types/auth-state.type';

export const AUTH_STATE = new InjectionToken<WritableSignal<AuthState>>('AUTH_STATE');
