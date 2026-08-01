import { Component, effect, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserProfile } from '@models/auth/interfaces';
import {
  Recipe,
  RecipeIngredientGroup,
  RecipeInstructionSection,
  RecipeInstructionStep,
  RecipeNutritionRow,
  RecipeStorageNote,
} from '@models/storage';

export interface MealPrepCreatePayload {
  receiverUid: string;
  recipe: Recipe;
  file: File;
}

@Component({
  selector: 'app-meal-prep-create',
  imports: [ReactiveFormsModule],
  templateUrl: './meal-prep-create.component.html',
  styleUrl: './meal-prep-create.component.scss',
})
export class MealPrepCreateComponent {
  receiverOptions = input<UserProfile[]>([]);
  isUploading = input(false);
  uploadProgress = input(0);
  uploadEtaLabel = input('Beregner tid...');
  resetVersion = input(0);

  submitCreate = output<MealPrepCreatePayload>();
  cancelUploadRequest = output<void>();

  readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly receiverControl = new FormControl<string>('all', { nonNullable: true });
  readonly titleControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly servingsControl = new FormControl<number | null>(null);
  readonly prepTimeMinutesControl = new FormControl<number | null>(null);
  readonly cookTimeMinutesControl = new FormControl<number | null>(null);
  readonly totalTimeMinutesControl = new FormControl<number | null>(null);
  readonly caloriesControl = new FormControl<string>('', { nonNullable: true });
  readonly proteinControl = new FormControl<string>('', { nonNullable: true });
  readonly carbsControl = new FormControl<string>('', { nonNullable: true });
  readonly fatControl = new FormControl<string>('', { nonNullable: true });

  readonly formGroup = new FormGroup({
    receiver: this.receiverControl,
    title: this.titleControl,
    servings: this.servingsControl,
    prepTimeMinutes: this.prepTimeMinutesControl,
    cookTimeMinutes: this.cookTimeMinutesControl,
    totalTimeMinutes: this.totalTimeMinutesControl,
    calories: this.caloriesControl,
    protein: this.proteinControl,
    carbs: this.carbsControl,
    fat: this.fatControl,
  });

  readonly ingredientGroups = signal<RecipeIngredientGroup[]>([]);
  readonly instructionSections = signal<RecipeInstructionSection[]>([]);
  readonly storageNotes = signal<RecipeStorageNote[]>([]);
  readonly nutritionRows = signal<RecipeNutritionRow[]>([]);

  activeIngredientGroupIndex = signal(0);
  activeInstructionSectionIndex = signal(0);

  private lastResetVersion = -1;

  private readonly resetEffect = effect(() => {
    const nextVersion = this.resetVersion();

    if (this.lastResetVersion !== -1 && this.lastResetVersion !== nextVersion) {
      this.resetForm();
    }

    this.lastResetVersion = nextVersion;
  });

  addIngredientGroup(): void {
    this.ingredientGroups.update((groups) => [...groups, { title: '', items: [''] }]);
    this.activeIngredientGroupIndex.set(this.ingredientGroups().length - 1);
  }

  removeIngredientGroup(index: number): void {
    this.ingredientGroups.update((groups) => groups.filter((_, groupIndex) => groupIndex !== index));

    const maxIndex = Math.max(0, this.ingredientGroups().length - 1);
    this.activeIngredientGroupIndex.set(Math.min(this.activeIngredientGroupIndex(), maxIndex));
  }

  selectIngredientGroup(index: number): void {
    this.activeIngredientGroupIndex.set(index);
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

  removeIngredient(groupIndex: number, itemIndex: number): void {
    this.ingredientGroups.update((groups) =>
      groups.map((group, index) =>
        index === groupIndex
          ? { ...group, items: group.items.filter((_, currentIndex) => currentIndex !== itemIndex) }
          : group,
      ),
    );
  }

  removeIngredientFromGroup(group: RecipeIngredientGroup, itemIndex: number): void {
    const groupIndex = this.ingredientGroups().indexOf(group);

    if (groupIndex < 0) {
      return;
    }

    this.removeIngredient(groupIndex, itemIndex);
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

  removeIngredientGroupByRef(group: RecipeIngredientGroup): void {
    const groupIndex = this.ingredientGroups().indexOf(group);

    if (groupIndex < 0) {
      return;
    }

    this.removeIngredientGroup(groupIndex);
  }

  addIngredientFieldToGroup(group: RecipeIngredientGroup): void {
    const groupIndex = this.ingredientGroups().indexOf(group);

    if (groupIndex < 0) {
      return;
    }

    this.ingredientGroups.update((groups) =>
      groups.map((currentGroup, index) =>
        index === groupIndex ? { ...currentGroup, items: [...currentGroup.items, ''] } : currentGroup,
      ),
    );
  }

  addInstructionSection(): void {
    this.instructionSections.update((sections) => [
      ...sections,
      { title: '', steps: [{ title: '', description: '' }] },
    ]);
    this.activeInstructionSectionIndex.set(this.instructionSections().length - 1);
  }

  removeInstructionSection(index: number): void {
    this.instructionSections.update((sections) =>
      sections.filter((_, sectionIndex) => sectionIndex !== index),
    );

    const maxIndex = Math.max(0, this.instructionSections().length - 1);
    this.activeInstructionSectionIndex.set(Math.min(this.activeInstructionSectionIndex(), maxIndex));
  }

  selectInstructionSection(index: number): void {
    this.activeInstructionSectionIndex.set(index);
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

  removeInstruction(sectionIndex: number, stepIndex: number): void {
    this.instructionSections.update((sections) =>
      sections.map((section, index) =>
        index === sectionIndex
          ? { ...section, steps: section.steps.filter((_, currentIndex) => currentIndex !== stepIndex) }
          : section,
      ),
    );
  }

  removeInstructionFromSection(section: RecipeInstructionSection, stepIndex: number): void {
    const sectionIndex = this.instructionSections().indexOf(section);

    if (sectionIndex < 0) {
      return;
    }

    this.removeInstruction(sectionIndex, stepIndex);
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

  removeInstructionSectionByRef(section: RecipeInstructionSection): void {
    const sectionIndex = this.instructionSections().indexOf(section);

    if (sectionIndex < 0) {
      return;
    }

    this.removeInstructionSection(sectionIndex);
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

  addStorageNote(): void {
    this.storageNotes.update((notes) => [...notes, { title: '', description: '' }]);
  }

  removeStorageNote(index: number): void {
    this.storageNotes.update((notes) => notes.filter((_, noteIndex) => noteIndex !== index));
  }

  updateStorageNoteTitle(index: number, value: string): void {
    this.storageNotes.update((notes) =>
      notes.map((note, noteIndex) => (noteIndex === index ? { ...note, title: value } : note)),
    );
  }

  updateStorageNoteDescription(index: number, value: string): void {
    this.storageNotes.update((notes) =>
      notes.map((note, noteIndex) => (noteIndex === index ? { ...note, description: value } : note)),
    );
  }

  addNutritionRow(): void {
    this.nutritionRows.update((rows) => [...rows, { name: '', value: '', unit: '' }]);
  }

  removeNutritionRow(index: number): void {
    this.nutritionRows.update((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
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

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (this.isUploading()) {
      return;
    }

    const file = this.fileInputRef()?.nativeElement.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const ingredientGroups = this.buildIngredientGroups();
    const instructionSections = this.buildInstructionSections();

    this.submitCreate.emit({
      receiverUid: this.receiverControl.value,
      recipe: {
        title: this.titleControl.value.trim(),
        servings: this.servingsControl.value,
        prepTimeMinutes: this.prepTimeMinutesControl.value,
        cookTimeMinutes: this.cookTimeMinutesControl.value,
        totalTimeMinutes: this.totalTimeMinutesControl.value,
        ingredientGroups,
        instructionSections,
        storageNotes: this.getSanitizedStorageNotes(),
        nutritionPerServing: this.buildNutritionRows(),
        ingredients: this.flattenIngredientItems(ingredientGroups),
        instructions: this.flattenInstructionItems(instructionSections),
        macros: this.buildLegacyMacros(),
      },
      file,
    });
  }

  resetForm(): void {
    this.formGroup.reset({
      receiver: 'all',
      title: '',
      servings: null,
      prepTimeMinutes: null,
      cookTimeMinutes: null,
      totalTimeMinutes: null,
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
    });
    this.ingredientGroups.set([]);
    this.instructionSections.set([]);
    this.storageNotes.set([]);
    this.nutritionRows.set([]);
    this.activeIngredientGroupIndex.set(0);
    this.activeInstructionSectionIndex.set(0);

    const fileInput = this.fileInputRef()?.nativeElement;

    if (fileInput) {
      fileInput.value = '';
    }
  }

  cancelUpload(): void {
    this.cancelUploadRequest.emit();
  }

  private buildIngredientGroups(): RecipeIngredientGroup[] {
    return this.ingredientGroups()
      .map((group, index) => ({
        title: group.title.trim() || `Ingrediensgruppe ${index + 1}`,
        items: group.items.map((item) => item.trim()).filter((item) => item.length > 0),
      }))
      .filter((group) => group.items.length > 0);
  }

  private buildInstructionSections(): RecipeInstructionSection[] {
    return this.instructionSections()
      .map((section, index) => ({
        title: section.title.trim() || `Sektion ${index + 1}`,
        steps: section.steps
          .map((step) => this.normalizeInstructionStep(step))
          .filter((step) => step.title.length > 0 || step.description.length > 0),
      }))
      .filter((section) => section.steps.length > 0);
  }

  private flattenIngredientItems(groups: RecipeIngredientGroup[]): string[] {
    return groups.flatMap((group) => group.items);
  }

  private flattenInstructionItems(sections: RecipeInstructionSection[]): string[] {
    return sections
      .flatMap((section) => section.steps)
      .map((step) => step.description || step.title)
      .filter((step) => step.length > 0);
  }

  private normalizeInstructionStep(step: RecipeInstructionStep): RecipeInstructionStep {
    return {
      title: step.title.trim(),
      description: step.description.trim(),
    };
  }

  private buildNutritionRows(): RecipeNutritionRow[] {
    const dynamicRows = this.nutritionRows()
      .map((row) => ({
        name: row.name.trim(),
        value: row.value.trim(),
        unit: (row.unit || '').trim(),
      }))
      .filter((row) => row.name !== '' || row.value !== '' || row.unit !== '');

    if (dynamicRows.length > 0) {
      return dynamicRows.filter((row) => row.name !== '' && row.value !== '');
    }

    return [
      { name: 'Kalorier', value: this.caloriesControl.value.trim(), unit: 'kcal' },
      { name: 'Protein', value: this.proteinControl.value.trim(), unit: 'g' },
      { name: 'Kulhydrat', value: this.carbsControl.value.trim(), unit: 'g' },
      { name: 'Fedt', value: this.fatControl.value.trim(), unit: 'g' },
    ].filter((row) => row.value !== '');
  }

  getSanitizedStorageNotes(): RecipeStorageNote[] {
    return this.storageNotes()
      .map((note) => ({
        title: note.title.trim(),
        description: note.description.trim(),
      }))
      .filter((note) => note.title.length > 0 || note.description.length > 0);
  }

  private buildLegacyMacros(): string[] {
    const nutritionRows = this.buildNutritionRows();
    const rowMap = new Map<string, string>(
      nutritionRows.map((row) => [row.name.trim().toLowerCase(), row.value.trim()]),
    );

    return [
      rowMap.get('kalorier') || this.caloriesControl.value.trim(),
      rowMap.get('protein') || this.proteinControl.value.trim(),
      rowMap.get('kulhydrat') || rowMap.get('kulhydrater') || this.carbsControl.value.trim(),
      rowMap.get('fedt') || this.fatControl.value.trim(),
    ];
  }
}
