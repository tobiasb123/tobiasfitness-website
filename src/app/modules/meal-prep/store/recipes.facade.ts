import { inject, Injectable } from '@angular/core';
import { DocumentFile } from '@models/storage';
import { Store } from '@ngrx/store';
import { filter, Observable, switchMap, tap } from 'rxjs';
import { loadRecipesAction, removeRecipeAction, upsertRecipeAction } from './recipes.actions';
import {
  selectLoadingRecipes,
  selectLoadingRecipesError,
  selectRecipes,
  selectRecipesFeature,
} from './recipes.selectors';

@Injectable({ providedIn: 'root' })
export class RecipesFacade {
  private store = inject(Store);

  public getRecipes(): Observable<DocumentFile[]> {
    return this.store.select(selectRecipesFeature).pipe(
      tap((state) => {
        if (!state.loaded && !state.loading) {
          this.store.dispatch(loadRecipesAction());
        }
      }),
      filter((state) => state.loaded),
      switchMap(() => this.store.select(selectRecipes)),
    );
  }

  public upsertRecipe(recipe: DocumentFile): void {
    this.store.dispatch(upsertRecipeAction({ recipe }));
  }

  public removeRecipe(id: string): void {
    this.store.dispatch(removeRecipeAction({ id }));
  }

  public isLoadingRecipes(): Observable<boolean> {
    return this.store.select(selectLoadingRecipes);
  }

  public getLoadingRecipesError(): Observable<string> {
    return this.store.select(selectLoadingRecipesError);
  }
}
