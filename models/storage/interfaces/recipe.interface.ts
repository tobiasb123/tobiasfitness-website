export interface RecipeIngredientGroup {
  title: string;
  items: string[];
}

export interface RecipeInstructionSection {
  title: string;
  steps: RecipeInstructionStep[];
}

export interface RecipeInstructionStep {
  title: string;
  description: string;
}

export interface RecipeNutritionRow {
  name: string;
  value: string;
  unit?: string;
}

export interface RecipeStorageNote {
  title: string;
  description: string;
}

export interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  macros: string[];
  servings?: number | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  totalTimeMinutes?: number | null;
  ingredientGroups?: RecipeIngredientGroup[];
  instructionSections?: RecipeInstructionSection[];
  storageNotes?: RecipeStorageNote[];
  nutritionPerServing?: RecipeNutritionRow[];
}
