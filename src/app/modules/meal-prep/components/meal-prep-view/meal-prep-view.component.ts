import { Component, input, output } from '@angular/core';
import {
  DocumentFile,
  Recipe,
  RecipeIngredientGroup,
  RecipeInstructionSection,
  RecipeInstructionStep,
  RecipeNutritionRow,
  RecipeStorageNote,
} from '@models/storage';

@Component({
  selector: 'app-meal-prep-view',
  templateUrl: './meal-prep-view.component.html',
  styleUrl: './meal-prep-view.component.scss',
})
export class MealPrepViewComponent {
  recipe = input<DocumentFile | null>(null);
  visible = input(false);

  close = output<void>();

  closeView(): void {
    this.close.emit();
  }

  getIngredientGroups(recipe: Recipe | undefined): RecipeIngredientGroup[] {
    if (!recipe) {
      return [];
    }

    if (recipe.ingredientGroups && recipe.ingredientGroups.length > 0) {
      return recipe.ingredientGroups;
    }

    const ingredients = recipe.ingredients || [];

    if (ingredients.length === 0) {
      return [];
    }

    return [{ title: 'Ingredienser', items: ingredients }];
  }

  getInstructionSections(recipe: Recipe | undefined): RecipeInstructionSection[] {
    if (!recipe) {
      return [];
    }

    if (recipe.instructionSections && recipe.instructionSections.length > 0) {
      return recipe.instructionSections;
    }

    const instructions = recipe.instructions || [];

    if (instructions.length === 0) {
      return [];
    }

    return [
      {
        title: 'Fremgangsmåde',
        steps: instructions.map((description) => ({ title: '', description })),
      },
    ];
  }

  getNutritionRows(recipe: Recipe | undefined): RecipeNutritionRow[] {
    if (!recipe) {
      return [];
    }

    if (recipe.nutritionPerServing && recipe.nutritionPerServing.length > 0) {
      return recipe.nutritionPerServing;
    }

    const macros = recipe.macros || [];
    return [
      { name: 'Kalorier', value: macros[0] || '-', unit: 'kcal' },
      { name: 'Protein', value: macros[1] || '-', unit: 'g' },
      { name: 'Kulhydrat', value: macros[2] || '-', unit: 'g' },
      { name: 'Fedt', value: macros[3] || '-', unit: 'g' },
    ];
  }

  getStorageNotes(recipe: Recipe | undefined): RecipeStorageNote[] {
    if (!recipe?.storageNotes || recipe.storageNotes.length === 0) {
      return [];
    }

    return recipe.storageNotes.map((note) => ({
      title: (note.title || '').trim(),
      description: (note.description || '').trim(),
    }));
  }
}
