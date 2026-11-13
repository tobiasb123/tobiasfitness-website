import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserProfile } from '@models/auth/interfaces';
import { DocumentFile, RecipeCategory } from '@models/storage';
import { AuthFunctionsService } from '@modules/auth';
import { BehaviorSubject, of } from 'rxjs';
import { vi } from 'vitest';
import { AdminFacade } from '../admin-menu';
import { ToastService } from '../core/services/toast/toast.service';
import { MealPrepComponent } from './meal-prep.component';
import { StorageFunctions } from './services/storage-functions.service';
import { RecipesFacade } from './store/recipes.facade';

describe('MealPrepComponent', () => {
  let fixture: ComponentFixture<MealPrepComponent>;
  const adminUser: UserProfile = {
    uid: 'user-1',
    email: 'admin@example.com',
    admin: true,
    firstName: 'Admin',
    lastName: 'User',
    age: 30,
    phoneNumber: '12345678',
    address: { city: 'København', postalCode: 1000, street: 'Testvej 1' },
  };
  const profile = signal<UserProfile>(adminUser);
  const recipes = new BehaviorSubject<DocumentFile[]>([]);
  const loading = new BehaviorSubject(false);
  const error = new BehaviorSubject('');
  const facade = {
    getRecipes: () => recipes.asObservable(),
    isLoadingRecipes: () => loading.asObservable(),
    getLoadingRecipesError: () => error.asObservable(),
    upsertRecipe: vi.fn(),
  };
  const toast = { open: vi.fn() };
  const storage = { saveRecipe: vi.fn() };

  function recipe(id: string, category?: RecipeCategory, uid = 'all'): DocumentFile {
    return {
      id,
      uid,
      filePath: '',
      fileType: 'recipe',
      fileName: '',
      folderPath: '',
      fileUrl: 'test.png',
      timeCreated: '2026-11-05T12:00:00Z',
      recipe: {
        title: id,
        category,
        ingredients: [],
        instructions: [],
        macros: ['100', '20', '30', '10'],
      },
    };
  }

  beforeEach(async () => {
    profile.set(adminUser);
    recipes.next([
      recipe('Shared breakfast', 'breakfast'),
      recipe('Personal breakfast', 'breakfast', 'user-1'),
      recipe('Other user breakfast', 'breakfast', 'other'),
      recipe('Lunch', 'lunch'),
      recipe('Snack recipe', 'snack'),
      recipe('Legacy recipe'),
    ]);
    loading.next(false);
    error.next('');
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [MealPrepComponent],
      providers: [
        { provide: AuthFunctionsService, useValue: { currentUserProfile: profile } },
        { provide: AdminFacade, useValue: { getUsers: () => of([adminUser]) } },
        { provide: RecipesFacade, useValue: facade },
        { provide: StorageFunctions, useValue: storage },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MealPrepComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('filters shared and assigned recipes by category and keeps legacy recipes accessible', () => {
    let text: string = fixture.nativeElement.querySelector('.grid').textContent;
    expect(text).toContain('Shared breakfast');
    expect(fixture.nativeElement.textContent).toContain('Personal breakfast');
    expect(fixture.nativeElement.textContent).not.toContain('Other user breakfast');
    expect(fixture.nativeElement.textContent).not.toContain('Lunch');
    expect(text).toContain('Kalorier: 100');
    expect(text).toContain('05-11-2026');

    fixture.componentInstance.selectedCategory.set('lunch');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Lunch');
    expect(fixture.nativeElement.textContent).not.toContain('Shared breakfast');

    fixture.componentInstance.selectedCategory.set('uncategorized');
    fixture.detectChanges();
    text = fixture.nativeElement.textContent;
    expect(text).toContain('Legacy recipe');
    expect(text).toContain('Ikke kategoriseret (1)');
  });

  it('opens a recipe instead of the overview and restores the selected category on return', () => {
    fixture.componentInstance.selectedCategory.set('lunch');
    fixture.detectChanges();
    const card: HTMLButtonElement = fixture.nativeElement.querySelector('.recipe-card');
    card.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.grid')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-meal-prep-view').textContent).toContain(
      'Lunch',
    );
    const nutritionTable: HTMLElement = fixture.nativeElement.querySelector('.nutrition-table');
    expect(nutritionTable.getAttribute('aria-label')).toBe('Næringsindhold pr. portion');
    expect(nutritionTable.parentElement?.textContent).toContain('Næringsindhold (pr. portion)');
    expect(nutritionTable.textContent).toContain('100');
    fixture.nativeElement.querySelector('.back-button').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedCategory()).toBe('lunch');
    expect(fixture.nativeElement.querySelector('.grid').textContent).toContain('Lunch');
  });

  it('shows snack recipes when selecting the Snack category', () => {
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.tabs button'));
    const snackButton = buttons.find((button) => button.textContent?.trim() === 'Snack');
    expect(snackButton).toBeDefined();
    snackButton!.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.grid').textContent).toContain('Snack recipe');
    expect(fixture.nativeElement.textContent).not.toContain('Shared breakfast');
  });

  it('keeps the form and file input mounted when the switch or detail view is closed', () => {
    const toggle: HTMLInputElement = fixture.nativeElement.querySelector('[role="switch"]');
    const container: HTMLElement = fixture.nativeElement.querySelector('#recipe-creation');
    expect(container.hidden).toBe(true);
    toggle.click();
    fixture.detectChanges();
    const title: HTMLInputElement = container.querySelector('#title')!;
    const file = container.querySelector('input[type="file"]');
    title.value = 'Draft';
    title.dispatchEvent(new Event('input'));
    toggle.click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.recipe-card').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.back-button').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[role="switch"]').click();
    fixture.detectChanges();
    expect(container.querySelector('#title')).toBe(title);
    expect(container.querySelector('input[type="file"]')).toBe(file);
    expect(title.value).toBe('Draft');
  });

  it('keeps the creation form open and its draft intact after viewing a recipe', () => {
    fixture.nativeElement.querySelector('[role="switch"]').click();
    fixture.detectChanges();
    const title: HTMLInputElement = fixture.nativeElement.querySelector('#recipe-creation #title');
    title.value = 'Draft';
    title.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('.recipe-card').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#recipe-creation').hidden).toBe(true);
    fixture.nativeElement.querySelector('.back-button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#recipe-creation').hidden).toBe(false);
    expect(title.value).toBe('Draft');
  });

  it('shows loading and empty category states', () => {
    loading.next(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Indlæser',
    );
    loading.next(false);
    fixture.componentInstance.selectedCategory.set('dinner');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ingen fælles opskrifter');
    expect(fixture.nativeElement.textContent).toContain('ingen personlige opskrifter');
  });

  it('reports an upload whose response does not retain the chosen category', async () => {
    const saved = recipe('New recipe');
    storage.saveRecipe.mockReturnValue({ cancel: vi.fn(), promise: Promise.resolve(saved) });
    await fixture.componentInstance.submitRecipe({
      file: new File(['image'], 'meal.png'),
      receiverUids: ['all'],
      recipe: { ...saved.recipe!, category: 'lunch' },
    });
    expect(facade.upsertRecipe).toHaveBeenCalledWith(saved);
    expect(toast.open).toHaveBeenCalledWith(
      expect.stringContaining('kategorien blev ikke gemt'),
      'error',
    );
    expect(toast.open).not.toHaveBeenCalledWith('Opskrift blev oprettet', 'success');
  });

  it('hides the creation controls from non-admins and displays errors', () => {
    profile.set({ ...adminUser, admin: false });
    error.next('Kunne ikke hente opskrifter');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="switch"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('#recipe-creation')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Kunne ikke hente',
    );
  });
});
