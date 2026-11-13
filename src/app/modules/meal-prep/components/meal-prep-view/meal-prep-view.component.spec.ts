import { TestBed } from '@angular/core/testing';
import { DocumentFile } from '@models/storage';
import { MealPrepViewComponent } from './meal-prep-view.component';

describe('MealPrepViewComponent', () => {
  it('renders legacy and structured recipe data when the input changes', () => {
    const fixture = TestBed.createComponent(MealPrepViewComponent);
    const document: DocumentFile = {
      id: 'recipe-1',
      uid: 'all',
      filePath: '',
      fileType: 'recipe',
      fileName: '',
      folderPath: '',
      fileUrl: '',
      timeCreated: '',
      recipe: {
        title: 'Legacy',
        ingredients: ['Rice'],
        instructions: ['Cook'],
        macros: ['100', '5', '20', '1'],
      },
    };

    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('recipe', document);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(fixture.nativeElement.textContent).toContain('Rice');
    expect(fixture.nativeElement.textContent).toContain('Cook');
    expect(fixture.nativeElement.textContent).toContain('100');
    const originalGroups = component.ingredientGroups();
    fixture.detectChanges();
    expect(component.ingredientGroups()).toBe(originalGroups);

    fixture.componentRef.setInput('recipe', {
      ...document,
      recipe: {
        ...document.recipe,
        ingredientGroups: [{ title: 'Group', items: ['Beans'] }],
        instructionSections: [{ title: 'Steps', steps: [{ title: '', description: 'Mix' }] }],
        nutritionPerServing: [{ name: 'Fiber', value: '10', unit: 'g' }],
        storageNotes: [{ title: ' Cold ', description: ' Refrigerate ' }],
      },
    });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Beans');
    expect(text).toContain('Mix');
    expect(text).toContain('Fiber');
    expect(text).toContain('Refrigerate');
    expect(text).not.toContain('Rice');
    expect(component.storageNotes()).toEqual([{ title: 'Cold', description: 'Refrigerate' }]);
  });
});
