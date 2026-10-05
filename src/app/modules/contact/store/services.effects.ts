import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { FirebaseError } from 'firebase/app';
import { catchError, exhaustMap, from, map, of } from 'rxjs';
import { ContactFunctionsService } from '../services/contact-functions/contact-functions.service';
import {
  loadServicesAction,
  loadServicesFailAction,
  loadServicesSuccessAction,
  updateServiceAction,
  updateServiceFailAction,
  updateServiceSuccessAction,
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

  updateService = createEffect(() =>
    this.actions.pipe(
      ofType(updateServiceAction),
      exhaustMap(({ service }) =>
        from(this.contactFunctions.updateService(service)).pipe(
          map((updatedService) => updateServiceSuccessAction({ service: updatedService })),
          catchError((error: unknown) =>
            of(
              updateServiceFailAction({
                serviceId: service.id,
                error: error instanceof Error ? error.message : 'Ydelsen kunne ikke gemmes.',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
