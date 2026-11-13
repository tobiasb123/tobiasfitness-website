import { RecipeIngredientGroup, RecipeInstructionSection, RecipeStorageNote } from '@models/storage';

export function normalizeStorageNotes(notes: RecipeStorageNote[]): RecipeStorageNote[] {
  return notes
    .map((note) => ({
      title: note.title.trim(),
      description: note.description.trim(),
    }))
    .filter((note) => note.title.length > 0 || note.description.length > 0);
}

export function flattenIngredients(groups: RecipeIngredientGroup[]): string[] {
  return groups.flatMap((group) => group.items);
}

export function flattenInstructions(sections: RecipeInstructionSection[]): string[] {
  return sections
    .flatMap((section) => section.steps)
    .map((step) => step.description || step.title)
    .filter((value) => value.trim().length > 0);
}
