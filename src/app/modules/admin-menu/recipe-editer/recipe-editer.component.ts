import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserProfile } from '@models/auth/interfaces';
import {
  DocumentFile,
  Recipe,
  RecipeIngredientGroup,
  RecipeInstructionSection,
  RecipeNutritionRow,
  RecipeStorageNote,
} from '@models/storage';
import { RecipesFacade } from '@modules/meal-prep';
import { ToastService } from '../../core/services/toast/toast.service';
import { StorageFunctions } from '../../meal-prep/services/storage-functions.service';

@Component({
  selector: 'app-recipe-editer',
  imports: [ReactiveFormsModule],
  templateUrl: './recipe-editer.component.html',
  styleUrl: './recipe-editer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeEditerComponent implements OnDestroy {
  selectedRecipe = input<DocumentFile | undefined>(undefined);
  users = input<UserProfile[]>([]);

  closed = output<void>();
  deleted = output<string>();

  private storageFunctions = inject(StorageFunctions);
  private recipesFacade = inject(RecipesFacade);
  private toast = inject(ToastService);

  private recipeImagePreviewObjectUrl: string | null = null;

  readonly receiverControl = new FormControl<string>('all', { nonNullable: true });
  readonly titleControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly servingsControl = new FormControl<number | null>(null);
  readonly prepTimeMinutesControl = new FormControl<number | null>(null);
  readonly cookTimeMinutesControl = new FormControl<number | null>(null);
  readonly totalTimeMinutesControl = new FormControl<number | null>(null);

  readonly formGroup = new FormGroup({
    receiver: this.receiverControl,
    title: this.titleControl,
    servings: this.servingsControl,
    prepTimeMinutes: this.prepTimeMinutesControl,
    cookTimeMinutes: this.cookTimeMinutesControl,
    totalTimeMinutes: this.totalTimeMinutesControl,
  });

  readonly ingredientGroups = signal<RecipeIngredientGroup[]>([]);
  readonly instructionSections = signal<RecipeInstructionSection[]>([]);
  readonly storageNotes = signal<RecipeStorageNote[]>([]);
  readonly nutritionRows = signal<RecipeNutritionRow[]>([]);

  readonly selectedRecipeImageFile = signal<File | null>(null);
  readonly recipeImagePreviewUrl = signal('');
  readonly isRecipeSaving = signal(false);
  readonly isRecipeDeleting = signal(false);
  readonly showDeleteConfirmation = signal(false);

  private readonly selectedRecipeEffect = effect(() => {
    this.hydrateFromRecipe(this.selectedRecipe());
  });

  addIngredientGroup(): void {
    this.ingredientGroups.update((groups) => [...groups, { title: '', items: [''] }]);
  }

  removeIngredientGroupByRef(group: RecipeIngredientGroup): void {
    const groupIndex = this.ingredientGroups().indexOf(group);

    if (groupIndex < 0) {
      return;
    }

    this.ingredientGroups.update((groups) =>
      groups.filter((_, currentGroupIndex) => currentGroupIndex !== groupIndex),
    );
  }

  updateIngredientGroupTitle(group: RecipeIngredientGroup, title: string): void {
    const groupIndex = this.ingredientGroups().indexOf(group);

    if (groupIndex < 0) {
      return;
    }

    this.ingredientGroups.update((groups) =>
      groups.map((currentGroup, index) =>
        index === groupIndex ? { ...currentGroup, title } : currentGroup,
      ),
    );
  }

  addIngredientFieldToGroup(group: RecipeIngredientGroup): void {
    const groupIndex = this.ingredientGroups().indexOf(group);

    if (groupIndex < 0) {
      return;
    }

    this.ingredientGroups.update((groups) =>
      groups.map((currentGroup, index) =>
        index === groupIndex
          ? { ...currentGroup, items: [...currentGroup.items, ''] }
          : currentGroup,
      ),
    );
  }

  updateIngredientItem(group: RecipeIngredientGroup, itemIndex: number, value: string): void {
    const groupIndex = this.ingredientGroups().indexOf(group);

    if (groupIndex < 0) {
      return;
    }

    this.ingredientGroups.update((groups) =>
      groups.map((currentGroup, index) => {
        if (index !== groupIndex) {
          return currentGroup;
        }

        return {
          ...currentGroup,
          items: currentGroup.items.map((item, currentItemIndex) =>
            currentItemIndex === itemIndex ? value : item,
          ),
        };
      }),
    );
  }

  removeIngredientFromGroup(group: RecipeIngredientGroup, itemIndex: number): void {
    const groupIndex = this.ingredientGroups().indexOf(group);

    if (groupIndex < 0) {
      return;
    }

    this.ingredientGroups.update((groups) =>
      groups.map((currentGroup, index) =>
        index === groupIndex
          ? {
              ...currentGroup,
              items: currentGroup.items.filter(
                (_, currentItemIndex) => currentItemIndex !== itemIndex,
              ),
            }
          : currentGroup,
      ),
    );
  }

  addInstructionSection(): void {
    this.instructionSections.update((sections) => [
      ...sections,
      { title: '', steps: [{ title: '', description: '' }] },
    ]);
  }

  removeInstructionSectionByRef(section: RecipeInstructionSection): void {
    const sectionIndex = this.instructionSections().indexOf(section);

    if (sectionIndex < 0) {
      return;
    }

    this.instructionSections.update((sections) =>
      sections.filter((_, currentSectionIndex) => currentSectionIndex !== sectionIndex),
    );
  }

  updateInstructionSectionTitle(section: RecipeInstructionSection, title: string): void {
    const sectionIndex = this.instructionSections().indexOf(section);

    if (sectionIndex < 0) {
      return;
    }

    this.instructionSections.update((sections) =>
      sections.map((currentSection, index) =>
        index === sectionIndex ? { ...currentSection, title } : currentSection,
      ),
    );
  }

  addInstructionFieldToSection(section: RecipeInstructionSection): void {
    const sectionIndex = this.instructionSections().indexOf(section);

    if (sectionIndex < 0) {
      return;
    }

    this.instructionSections.update((sections) =>
      sections.map((currentSection, index) =>
        index === sectionIndex
          ? {
              ...currentSection,
              steps: [...currentSection.steps, { title: '', description: '' }],
            }
          : currentSection,
      ),
    );
  }

  updateInstructionStepTitle(
    section: RecipeInstructionSection,
    stepIndex: number,
    value: string,
  ): void {
    const sectionIndex = this.instructionSections().indexOf(section);

    if (sectionIndex < 0) {
      return;
    }

    this.instructionSections.update((sections) =>
      sections.map((currentSection, index) => {
        if (index !== sectionIndex) {
          return currentSection;
        }

        return {
          ...currentSection,
          steps: currentSection.steps.map((step, currentStepIndex) =>
            currentStepIndex === stepIndex ? { ...step, title: value } : step,
          ),
        };
      }),
    );
  }

  updateInstructionStepDescription(
    section: RecipeInstructionSection,
    stepIndex: number,
    value: string,
  ): void {
    const sectionIndex = this.instructionSections().indexOf(section);

    if (sectionIndex < 0) {
      return;
    }

    this.instructionSections.update((sections) =>
      sections.map((currentSection, index) => {
        if (index !== sectionIndex) {
          return currentSection;
        }

        return {
          ...currentSection,
          steps: currentSection.steps.map((step, currentStepIndex) =>
            currentStepIndex === stepIndex ? { ...step, description: value } : step,
          ),
        };
      }),
    );
  }

  removeInstructionFromSection(section: RecipeInstructionSection, stepIndex: number): void {
    const sectionIndex = this.instructionSections().indexOf(section);

    if (sectionIndex < 0) {
      return;
    }

    this.instructionSections.update((sections) =>
      sections.map((currentSection, index) =>
        index === sectionIndex
          ? {
              ...currentSection,
              steps: currentSection.steps.filter(
                (_, currentStepIndex) => currentStepIndex !== stepIndex,
              ),
            }
          : currentSection,
      ),
    );
  }

  addStorageNote(): void {
    this.storageNotes.update((notes) => [...notes, { title: '', description: '' }]);
  }

  updateStorageNoteTitle(index: number, value: string): void {
    this.storageNotes.update((notes) =>
      notes.map((note, noteIndex) => (noteIndex === index ? { ...note, title: value } : note)),
    );
  }

  updateStorageNoteDescription(index: number, value: string): void {
    this.storageNotes.update((notes) =>
      notes.map((note, noteIndex) =>
        noteIndex === index ? { ...note, description: value } : note,
      ),
    );
  }

  removeStorageNote(index: number): void {
    this.storageNotes.update((notes) => notes.filter((_, noteIndex) => noteIndex !== index));
  }

  addNutritionRow(): void {
    this.nutritionRows.update((rows) => [...rows, { name: '', value: '', unit: '' }]);
  }

  updateNutritionRowName(index: number, value: string): void {
    this.nutritionRows.update((rows) =>
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, name: value } : row)),
    );
  }

  updateNutritionRowValue(index: number, value: string): void {
    this.nutritionRows.update((rows) =>
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, value } : row)),
    );
  }

  updateNutritionRowUnit(index: number, value: string): void {
    this.nutritionRows.update((rows) =>
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, unit: value } : row)),
    );
  }

  removeNutritionRow(index: number): void {
    this.nutritionRows.update((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
  }

  onRecipeImageSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const selectedFile = inputElement.files?.[0] || null;

    if (!selectedFile) {
      return;
    }

    this.selectedRecipeImageFile.set(selectedFile);
    this.setRecipeImagePreview(URL.createObjectURL(selectedFile), true);
  }

  openDeleteConfirmation(): void {
    this.showDeleteConfirmation.set(true);
  }

  cancelDeleteConfirmation(): void {
    this.showDeleteConfirmation.set(false);
  }

  async confirmDeleteRecipe(): Promise<void> {
    const recipe = this.selectedRecipe();

    if (!recipe) {
      this.toast.open('Vælg en opskrift først', 'error');
      return;
    }

    try {
      this.isRecipeDeleting.set(true);
      await this.storageFunctions.deleteRecipe(recipe.id);
      this.recipesFacade.removeRecipe(recipe.id);
      this.deleted.emit(recipe.id);
      this.toast.open('Opskrift slettet', 'success');
      this.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      this.toast.open(message || 'Kunne ikke slette opskriften', 'error');
    } finally {
      this.isRecipeDeleting.set(false);
      this.showDeleteConfirmation.set(false);
    }
  }

  async saveRecipeChanges(): Promise<void> {
    const recipe = this.selectedRecipe();

    if (!recipe) {
      this.toast.open('Vælg en opskrift først', 'error');
      return;
    }

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.toast.open('Opskriftnavn er påkrævet', 'error');
      return;
    }

    const normalizedIngredientGroups = this.getNormalizedIngredientGroups();
    const normalizedInstructionSections = this.getNormalizedInstructionSections();
    const normalizedStorageNotes = this.getNormalizedStorageNotes();
    const normalizedNutritionRows = this.getNormalizedNutritionRows();

    const updatedRecipeData: Recipe = {
      title: this.titleControl.value.trim(),
      ingredients: this.flattenIngredients(normalizedIngredientGroups),
      instructions: this.flattenInstructions(normalizedInstructionSections),
      macros: this.buildLegacyMacros(normalizedNutritionRows),
      servings: this.servingsControl.value,
      prepTimeMinutes: this.prepTimeMinutesControl.value,
      cookTimeMinutes: this.cookTimeMinutesControl.value,
      totalTimeMinutes: this.totalTimeMinutesControl.value,
      ingredientGroups: normalizedIngredientGroups,
      instructionSections: normalizedInstructionSections,
      storageNotes: normalizedStorageNotes,
      nutritionPerServing: normalizedNutritionRows,
    };

    const updatedDocument: DocumentFile = {
      ...recipe,
      uid: this.receiverControl.value,
      recipe: updatedRecipeData,
    };

    try {
      this.isRecipeSaving.set(true);
      const selectedImage = this.selectedRecipeImageFile();

      if (selectedImage) {
        const replacedDocument = await this.storageFunctions.updateRecipeAndFile(
          updatedRecipeData,
          updatedDocument.uid,
          recipe.id,
          selectedImage,
        ).promise;
        this.recipesFacade.upsertRecipe(replacedDocument);
        this.hydrateFromRecipe(replacedDocument);
      } else {
        await this.storageFunctions.updateRecipe(updatedDocument);
        this.recipesFacade.upsertRecipe(updatedDocument);
        this.hydrateFromRecipe(updatedDocument);
      }

      this.toast.open('Opskrift gemt', 'success');
    } catch {
      this.toast.open('Kunne ikke gemme opskriften', 'error');
    } finally {
      this.isRecipeSaving.set(false);
    }
  }

  close(): void {
    this.closed.emit();
  }

  ngOnDestroy(): void {
    if (this.recipeImagePreviewObjectUrl) {
      URL.revokeObjectURL(this.recipeImagePreviewObjectUrl);
      this.recipeImagePreviewObjectUrl = null;
    }
  }

  getRecipeOwnerLabel(uid: string): string {
    if (!uid || uid === 'all') {
      return 'Alle';
    }

    const user = this.users().find((item) => item.uid === uid);

    if (!user) {
      return 'Ukendt bruger';
    }

    return `${user.firstName} ${user.lastName}`;
  }

  private hydrateFromRecipe(document: DocumentFile | undefined): void {
    if (!document?.recipe) {
      this.formGroup.reset();
      this.receiverControl.setValue('all');
      this.ingredientGroups.set([]);
      this.instructionSections.set([]);
      this.storageNotes.set([]);
      this.nutritionRows.set([]);
      this.selectedRecipeImageFile.set(null);
      this.setRecipeImagePreview('');
      return;
    }

    const recipe = document.recipe;

    this.receiverControl.setValue(document.uid || 'all');
    this.titleControl.setValue(recipe.title || '');
    this.servingsControl.setValue(recipe.servings ?? null);
    this.prepTimeMinutesControl.setValue(recipe.prepTimeMinutes ?? null);
    this.cookTimeMinutesControl.setValue(recipe.cookTimeMinutes ?? null);
    this.totalTimeMinutesControl.setValue(recipe.totalTimeMinutes ?? null);

    this.ingredientGroups.set(this.toIngredientGroups(recipe));
    this.instructionSections.set(this.toInstructionSections(recipe));
    this.storageNotes.set(this.toStorageNotes(recipe));
    this.nutritionRows.set(this.toNutritionRows(recipe));

    this.selectedRecipeImageFile.set(null);
    this.setRecipeImagePreview(document.fileUrl || '');
  }

  private toIngredientGroups(recipe: Recipe): RecipeIngredientGroup[] {
    if (recipe.ingredientGroups && recipe.ingredientGroups.length > 0) {
      return recipe.ingredientGroups.map((group) => ({
        title: group.title || '',
        items: group.items.length ? [...group.items] : [''],
      }));
    }

    if (recipe.ingredients && recipe.ingredients.length > 0) {
      return [{ title: 'Ingredienser', items: [...recipe.ingredients] }];
    }

    return [];
  }

  private toInstructionSections(recipe: Recipe): RecipeInstructionSection[] {
    if (recipe.instructionSections && recipe.instructionSections.length > 0) {
      return recipe.instructionSections.map((section) => ({
        title: section.title || '',
        steps: section.steps.length
          ? section.steps.map((step) => ({
              title: step.title || '',
              description: step.description || '',
            }))
          : [{ title: '', description: '' }],
      }));
    }

    if (recipe.instructions && recipe.instructions.length > 0) {
      return [
        {
          title: 'Fremgangsmåde',
          steps: recipe.instructions.map((instruction, index) => ({
            title: `Trin ${index + 1}`,
            description: instruction,
          })),
        },
      ];
    }

    return [];
  }

  private toStorageNotes(recipe: Recipe): RecipeStorageNote[] {
    return recipe.storageNotes ? recipe.storageNotes.map((note) => ({ ...note })) : [];
  }

  private toNutritionRows(recipe: Recipe): RecipeNutritionRow[] {
    if (recipe.nutritionPerServing && recipe.nutritionPerServing.length > 0) {
      return recipe.nutritionPerServing.map((row) => ({ ...row }));
    }

    if (recipe.macros && recipe.macros.length > 0) {
      return [
        { name: 'Kalorier', value: recipe.macros[0] || '', unit: 'kcal' },
        { name: 'Protein', value: recipe.macros[1] || '', unit: 'g' },
        { name: 'Kulhydrater', value: recipe.macros[2] || '', unit: 'g' },
        { name: 'Fedt', value: recipe.macros[3] || '', unit: 'g' },
      ];
    }

    return [];
  }

  private setRecipeImagePreview(url: string, revokePrevious = false): void {
    if (this.recipeImagePreviewObjectUrl && revokePrevious) {
      URL.revokeObjectURL(this.recipeImagePreviewObjectUrl);
      this.recipeImagePreviewObjectUrl = null;
    }

    if (!url) {
      this.recipeImagePreviewUrl.set('');
      return;
    }

    this.recipeImagePreviewObjectUrl = revokePrevious ? url : null;
    this.recipeImagePreviewUrl.set(url);
  }

  private getNormalizedIngredientGroups(): RecipeIngredientGroup[] {
    return this.ingredientGroups()
      .map((group) => ({
        title: group.title.trim(),
        items: group.items.map((item) => item.trim()).filter((item) => item.length > 0),
      }))
      .filter((group) => group.title.length > 0 || group.items.length > 0);
  }

  private getNormalizedInstructionSections(): RecipeInstructionSection[] {
    return this.instructionSections()
      .map((section) => ({
        title: section.title.trim(),
        steps: section.steps
          .map((step) => ({
            title: step.title.trim(),
            description: step.description.trim(),
          }))
          .filter((step) => step.title.length > 0 || step.description.length > 0),
      }))
      .filter((section) => section.title.length > 0 || section.steps.length > 0);
  }

  private getNormalizedStorageNotes(): RecipeStorageNote[] {
    return this.storageNotes()
      .map((note) => ({
        title: note.title.trim(),
        description: note.description.trim(),
      }))
      .filter((note) => note.title.length > 0 || note.description.length > 0);
  }

  private getNormalizedNutritionRows(): RecipeNutritionRow[] {
    return this.nutritionRows()
      .map((row) => ({
        name: row.name.trim(),
        value: row.value.trim(),
        unit: row.unit?.trim() || '',
      }))
      .filter((row) => row.name.length > 0 || row.value.length > 0 || (row.unit?.length || 0) > 0);
  }

  private flattenIngredients(groups: RecipeIngredientGroup[]): string[] {
    return groups.flatMap((group) => group.items);
  }

  private flattenInstructions(sections: RecipeInstructionSection[]): string[] {
    return sections.flatMap((section) =>
      section.steps
        .map((step) => step.description || step.title)
        .filter((value) => value && value.trim().length > 0),
    );
  }

  private buildLegacyMacros(rows: RecipeNutritionRow[]): string[] {
    const byName = new Map(rows.map((row) => [row.name.toLowerCase(), row.value]));

    return [
      byName.get('kalorier') || byName.get('calories') || rows[0]?.value || '',
      byName.get('protein') || rows[1]?.value || '',
      byName.get('kulhydrater') || byName.get('carbs') || rows[2]?.value || '',
      byName.get('fedt') || byName.get('fat') || rows[3]?.value || '',
    ];
  }
}
