import { inject, Injectable } from '@angular/core';
import { UserProfile } from '@models/auth/interfaces';
import { FirebaseService } from '@modules/firebase';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { FirebaseError } from 'firebase/app';
import { catchError, exhaustMap, map, of } from 'rxjs';
import {
  loadAuthProfileAction,
  loadAuthProfileFailAction,
  loadAuthProfileSuccessAction,
  updateAuthProfileAction,
  updateAuthProfileFailAction,
  updateAuthProfileSuccessAction,
} from './auth-profile.actions';

@Injectable()
export class AuthProfileEffects {
  private actions = inject(Actions);
  private firebaseService = inject(FirebaseService);

  loadProfile = createEffect(() =>
    this.actions.pipe(
      ofType(loadAuthProfileAction),
      exhaustMap(() => this.firebaseService.httpGet<UserProfile>('auth-getUserProfile')),
      map((profile) => loadAuthProfileSuccessAction({ profile })),
      catchError((error: FirebaseError) => of(loadAuthProfileFailAction({ error: error.message }))),
    ),
  );

  updateProfile = createEffect(() =>
    this.actions.pipe(
      ofType(updateAuthProfileAction),
      exhaustMap((action) =>
        this.firebaseService.httpPost<Partial<UserProfile>, Partial<UserProfile>>(
          'auth-updateDetails',
          action.updates,
        ),
      ),
      map((updates) => updateAuthProfileSuccessAction({ updates })),
      catchError((error: FirebaseError) =>
        of(updateAuthProfileFailAction({ error: error.message })),
      ),
    ),
  );
}
