import { DocumentFile } from '@models/storage';
import { createAction, props } from '@ngrx/store';

export const loadRecipesAction = createAction('[Recipes] Load Recipes');

export const loadRecipesSuccessAction = createAction(
  '[Recipes] Load Recipes Success',
  props<{ recipes: DocumentFile[] }>(),
);

export const loadRecipesFailAction = createAction(
  '[Recipes] Load Recipes Fail',
  props<{ error: string }>(),
);

export const upsertRecipeAction = createAction(
  '[Recipes] Upsert Recipe',
  props<{ recipe: DocumentFile }>(),
);

export const removeRecipeAction = createAction('[Recipes] Remove Recipe', props<{ id: string }>());
