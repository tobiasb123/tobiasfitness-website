import { TestBed } from '@angular/core/testing';
import { DocumentFile } from '@models/storage';
import { RecipesFacade } from '@modules/meal-prep';
import { vi } from 'vitest';
import { ToastService } from '../../core/services/toast/toast.service';
import { StorageFunctions } from '../../meal-prep/services/storage-functions.service';
import { RecipeEditerComponent } from './recipe-editer.component';

describe('RecipeEditerComponent category', () => {
  const document: DocumentFile = {
    id: 'recipe-1',
    uid: 'all',
    filePath: '',
    fileType: 'recipe',
    fileName: '',
    folderPath: '',
    fileUrl: '',
    timeCreated: '2026-11-05',
    recipe: { title: 'Meal', ingredients: [], instructions: [], macros: [] },
  };
  const storage = {
    updateRecipe: vi.fn().mockResolvedValue(undefined),
    updateRecipeAndFile: vi.fn(),
  };
  const facade = { upsertRecipe: vi.fn() };
  const toast = { open: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [RecipeEditerComponent],
      providers: [
        { provide: StorageFunctions, useValue: storage },
        { provide: RecipesFacade, useValue: facade },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();
  });

  it('hydrates legacy recipes and saves their selected category without replacing the image', async () => {
    const fixture = TestBed.createComponent(RecipeEditerComponent);
    fixture.componentRef.setInput('selectedRecipe', document);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Næringsindhold pr. portion');
    expect(fixture.componentInstance.categoryControl.value).toBe('');
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#edit-category');
    expect(Array.from(select.options).some((option) => option.value === 'snack' && option.text === 'Snack')).toBe(true);
    fixture.componentInstance.categoryControl.setValue('snack');
    await fixture.componentInstance.saveRecipeChanges();
    expect(storage.updateRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ recipe: expect.objectContaining({ category: 'snack' }) }),
    );
    expect(facade.upsertRecipe).toHaveBeenCalled();
  });

  it('preserves the category when replacing the image', async () => {
    const fixture = TestBed.createComponent(RecipeEditerComponent);
    fixture.componentRef.setInput('selectedRecipe', {
      ...document,
      recipe: { ...document.recipe!, category: 'breakfast' },
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.categoryControl.value).toBe('breakfast');
    const image = new File(['image'], 'meal.png', { type: 'image/png' });
    fixture.componentInstance.selectedRecipeImageFile.set(image);
    storage.updateRecipeAndFile.mockReturnValue({
      promise: Promise.resolve({
        ...document,
        recipe: { ...document.recipe!, category: 'breakfast' },
      }),
    });
    await fixture.componentInstance.saveRecipeChanges();
    expect(storage.updateRecipeAndFile).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'breakfast' }),
      ['all'],
      'recipe-1',
      image,
      expect.any(Function),
    );
    expect(toast.open).toHaveBeenCalledWith('Opskrift gemt', 'success');
  });

  it('reports an image replacement that did not persist the category', async () => {
    const fixture = TestBed.createComponent(RecipeEditerComponent);
    fixture.componentRef.setInput('selectedRecipe', document);
    fixture.detectChanges();
    fixture.componentInstance.categoryControl.setValue('dinner');
    fixture.componentInstance.selectedRecipeImageFile.set(new File(['image'], 'meal.png'));
    storage.updateRecipeAndFile.mockReturnValue({ promise: Promise.resolve(document) });
    await fixture.componentInstance.saveRecipeChanges();
    expect(toast.open).toHaveBeenCalledWith(
      expect.stringContaining('kategorien blev ikke gemt'),
      'error',
    );
    expect(toast.open).not.toHaveBeenCalledWith('Opskrift gemt', 'success');
  });

  it('preserves title-only groups and saves normalized recipe details when editing', async () => {
    const fixture = TestBed.createComponent(RecipeEditerComponent);
    fixture.componentRef.setInput('selectedRecipe', document);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.ingredientGroups.set([
      { title: ' Empty group ', items: [' '] },
      { title: '', items: [' Rice '] },
    ]);
    component.instructionSections.set([
      { title: ' Empty section ', steps: [{ title: '', description: '' }] },
      {
        title: '',
        steps: [{ title: ' Stir ', description: '' }, { title: '', description: ' Mix ' }],
      },
    ]);
    component.storageNotes.set([
      { title: ' Cold ', description: ' Fridge ' },
      { title: ' ', description: '' },
    ]);

    await component.saveRecipeChanges();
    expect(storage.updateRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        recipe: expect.objectContaining({
          ingredientGroups: [
            { title: 'Empty group', items: [] },
            { title: '', items: ['Rice'] },
          ],
          instructionSections: [
            { title: 'Empty section', steps: [] },
            {
              title: '',
              steps: [{ title: 'Stir', description: '' }, { title: '', description: 'Mix' }],
            },
          ],
          storageNotes: [{ title: 'Cold', description: 'Fridge' }],
          ingredients: ['Rice'],
          instructions: ['Stir', 'Mix'],
        }),
      }),
    );
  });
});
