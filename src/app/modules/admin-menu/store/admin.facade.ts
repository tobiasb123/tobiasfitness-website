import { inject, Injectable } from '@angular/core';
import { UserProfile } from '@models/auth/interfaces';
import { AuthFunctionsService } from '@modules/auth';
import { Store } from '@ngrx/store';
import { filter, Observable, switchMap, tap } from 'rxjs';
import { loadUsersAction } from './admin.actions';
import { selectAdminFeature, selectUsers } from './admin.selectors';

@Injectable({ providedIn: 'root' })
export class AdminFacade {
  private store = inject(Store);
  private authFunctions = inject(AuthFunctionsService);

  public getUsers(): Observable<UserProfile[]> {
    return this.store.select(selectAdminFeature).pipe(
      filter(() => this.authFunctions.currentUserProfile()?.admin),
      tap((state) => {
        if (!state.loaded && !state.loading) {
          this.store.dispatch(loadUsersAction());
        }
      }),
      filter((state) => state.loaded),
      switchMap(() => this.store.select(selectUsers)),
    );
  }
}
