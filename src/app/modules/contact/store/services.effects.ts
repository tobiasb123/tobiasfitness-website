import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { FirebaseError } from 'firebase/app';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { ContactFunctionsService } from '../services/contact-functions/contact-functions.service';
import {
  loadServicesAction,
  loadServicesFailAction,
  loadServicesSuccessAction,
} from './services.actions';

@Injectable()
export class ServicesEffects {
  private actions = inject(Actions);
  private contactFunctions = inject(ContactFunctionsService);

  loadServices = createEffect(() =>
    this.actions.pipe(
      ofType(loadServicesAction),
      exhaustMap(() => this.contactFunctions.getServices()),
      map((services) => loadServicesSuccessAction({ services })),
      catchError((error: FirebaseError) => of(loadServicesFailAction({ error: error.message }))),
    ),
  );
}
