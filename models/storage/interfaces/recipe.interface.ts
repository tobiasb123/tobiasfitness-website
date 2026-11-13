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
  category?: RecipeCategory;
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
export const RECIPE_CATEGORIES = [
  { value: 'breakfast', label: 'Morgenmad' },
  { value: 'lunch', label: 'Frokost' },
  { value: 'dinner', label: 'Aftensmad' },
  { value: 'snack', label: 'Snack' },
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number]['value'];
