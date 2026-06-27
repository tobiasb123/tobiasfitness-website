import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { logoutAction } from './auth.actions';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private store = inject(Store);

  public logout(): void {
    this.store.dispatch(logoutAction());
  }
}
