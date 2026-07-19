import { createFeatureSelector, createSelector } from '@ngrx/store';
import { recipesAdapter, RecipesState } from './recipes.reducer';

export const recipesFeature = 'recipes';

export const selectRecipesFeature = createFeatureSelector<RecipesState>(recipesFeature);

export const selectLoadingRecipes = createSelector(selectRecipesFeature, (state) => state.loading);

export const selectLoadedRecipes = createSelector(selectRecipesFeature, (state) => state.loaded);

export const selectLoadingRecipesError = createSelector(
  selectRecipesFeature,
  (state) => state.error,
);

const { selectAll } = recipesAdapter.getSelectors();

export const selectRecipes = createSelector(selectRecipesFeature, selectAll);
