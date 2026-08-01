import { DocumentFile } from '@models/storage';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  loadRecipesAction,
  loadRecipesFailAction,
  loadRecipesSuccessAction,
  removeRecipeAction,
  upsertRecipeAction,
} from './recipes.actions';

export interface RecipesState extends EntityState<DocumentFile> {
  loading: boolean;
  loaded: boolean;
  error: string;
}

export const recipesAdapter = createEntityAdapter<DocumentFile>({
  selectId: (recipe: DocumentFile) => recipe.id,
});

const initialState: RecipesState = recipesAdapter.getInitialState({
  loading: false,
  loaded: false,
  error: null,
});

export const recipesReducer = createReducer(
  initialState,
  on(loadRecipesAction, (state) => ({
    ...state,
    loading: true,
    loaded: false,
    error: null as string,
  })),
  on(loadRecipesSuccessAction, (state, action) =>
    recipesAdapter.setAll(action.recipes, {
      ...state,
      loading: false,
      loaded: true,
    }),
  ),
  on(loadRecipesFailAction, (state, action) => ({
    ...state,
    loading: false,
    error: action.error,
  })),
  on(upsertRecipeAction, (state, action) =>
    recipesAdapter.upsertOne(action.recipe, {
      ...state,
    }),
  ),
  on(removeRecipeAction, (state, action) =>
    recipesAdapter.removeOne(action.id, {
      ...state,
    }),
  ),
);
