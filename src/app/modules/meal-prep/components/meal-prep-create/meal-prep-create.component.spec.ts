import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MealPrepCreateComponent, MealPrepCreatePayload } from './meal-prep-create.component';

describe('MealPrepCreateComponent category', () => {
  let fixture: ComponentFixture<MealPrepCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MealPrepCreateComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(MealPrepCreateComponent);
    fixture.detectChanges();
  });

  it('requires a category and includes the selected value in the upload payload', () => {
    const component = fixture.componentInstance;
    expect(fixture.nativeElement.textContent).toContain('Næringsindhold pr. portion');
    const fileInput: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
    const file = new File(['image'], 'meal.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    component.titleControl.setValue('Meal');
    let payload: MealPrepCreatePayload | undefined;
    component.submitCreate.subscribe((value) => (payload = value));
    component.onSubmit(new Event('submit') as SubmitEvent);
    expect(payload).toBeUndefined();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#category-error').textContent).toContain(
      'Vælg en kategori',
    );
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#create-category');
    expect(Array.from(select.options).some((option) => option.value === 'snack' && option.text === 'Snack')).toBe(true);
    component.categoryControl.setValue('snack');
    component.onSubmit(new Event('submit') as SubmitEvent);
    expect(payload?.recipe.category).toBe('snack');
    expect(payload?.file).toBe(file);
    component.resetForm();
    expect(component.categoryControl.value).toBe('');
  });

  it('saves normalized groups, instructions, and storage notes for new recipes', () => {
    const component = fixture.componentInstance;
    const fileInput: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
    const file = new File(['image'], 'meal.png');
    Object.defineProperty(fileInput, 'files', { value: [file] });
    component.titleControl.setValue('Meal');
    component.categoryControl.setValue('lunch');
    component.ingredientGroups.set([
      { title: ' ', items: [' Rice ', ' '] },
      { title: 'Empty', items: [' '] },
    ]);
    component.instructionSections.set([
      {
        title: ' ',
        steps: [{ title: ' Stir ', description: ' ' }, { title: '', description: ' Mix ' }],
      },
      { title: 'Empty', steps: [{ title: '', description: '' }] },
    ]);
    component.storageNotes.set([
      { title: ' Cold ', description: ' Fridge ' },
      { title: ' ', description: '' },
    ]);
    let payload: MealPrepCreatePayload | undefined;
    component.submitCreate.subscribe((value) => (payload = value));
    component.onSubmit(new Event('submit') as SubmitEvent);
    expect(payload?.recipe).toEqual(
      expect.objectContaining({
        ingredientGroups: [{ title: 'Ingrediensgruppe 1', items: ['Rice'] }],
        instructionSections: [
          {
            title: 'Sektion 1',
            steps: [{ title: 'Stir', description: '' }, { title: '', description: 'Mix' }],
          },
        ],
        storageNotes: [{ title: 'Cold', description: 'Fridge' }],
        ingredients: ['Rice'],
        instructions: ['Stir', 'Mix'],
      }),
    );
  });
});
