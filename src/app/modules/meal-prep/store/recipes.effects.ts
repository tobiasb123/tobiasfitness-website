import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { FirebaseError } from 'firebase/app';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { StorageFunctions } from '../services/storage-functions.service';
import {
  loadRecipesAction,
  loadRecipesFailAction,
  loadRecipesSuccessAction,
} from './recipes.actions';

@Injectable()
export class RecipesEffects {
  private actions = inject(Actions);
  private storageFunctions = inject(StorageFunctions);

  loadRecipes = createEffect(() =>
    this.actions.pipe(
      ofType(loadRecipesAction),
      exhaustMap(() => this.storageFunctions.getRecipies()),
      map((recipes) => loadRecipesSuccessAction({ recipes })),
      catchError((error: FirebaseError) => of(loadRecipesFailAction({ error: error.message }))),
    ),
  );
}
