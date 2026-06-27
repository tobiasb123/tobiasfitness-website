import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { FirebaseError } from 'firebase/app';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { AdminFunctionsService } from '../services/admin-functions.service';
import { loadUsersAction, loadUsersFailAction, loadUsersSuccessAction } from './admin.actions';

@Injectable()
export class AdminEffects {
  private actions = inject(Actions);
  private adminFunctions = inject(AdminFunctionsService);

  loadUsers = createEffect(() =>
    this.actions.pipe(
      ofType(loadUsersAction),
      exhaustMap(() => this.adminFunctions.getUsers()),
      map((users) => loadUsersSuccessAction({ users: users })),
      catchError((error: FirebaseError) => of(loadUsersFailAction({ error: error.message }))),
    ),
  );
}
