import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthFunctionsService } from '@modules/auth';
import { DocumentFile } from '@models/storage';
import { TrainingProgram } from '@models/training';
import { filter, firstValueFrom, of } from 'rxjs';
import { AdminFacade } from '../../admin-menu';
import { MealPrepComponent } from '../../meal-prep/meal-prep.component';
import { StorageFunctions } from '../../meal-prep/services/storage-functions.service';
import { RecipesFacade } from '../../meal-prep/store/recipes.facade';
import { TrainingProgramService } from '../../training-program/services/training-program.service';
import { TrainingProgramComponent } from '../../training-program/training-program.component';
import { ToastService } from './toast/toast.service';

describe('detail navigation on feature routes', () => {
  const recipe: DocumentFile = {
    id: 'recipe-1',
    uid: 'all',
    filePath: '',
    fileType: 'recipe',
    fileName: '',
    folderPath: '',
    fileUrl: 'test.png',
    timeCreated: '2026-11-05T12:00:00Z',
    recipe: {
      title: 'Recipe',
      category: 'breakfast',
      ingredients: [],
      instructions: [],
      macros: ['100', '20', '30', '10'],
    },
  };
  const program: TrainingProgram = {
    id: 'program-1',
    assignedToUid: 'user-1',
    status: 'active',
    title: 'Program',
    clientName: 'Client',
    injuries: '',
    goal: '',
    startDate: '',
    endDate: '',
    sessionTime: '',
    tempo: '',
    rest: '',
    exercises: [],
    createdAt: '',
    updatedAt: '',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'meal-prep', component: MealPrepComponent },
          { path: 'training-program', component: TrainingProgramComponent },
        ]),
        provideLocationMocks(),
        { provide: AuthFunctionsService, useValue: { currentUserProfile: signal(undefined) } },
        { provide: AdminFacade, useValue: { getUsers: () => of([]) } },
        {
          provide: RecipesFacade,
          useValue: {
            getRecipes: () => of([recipe]),
            isLoadingRecipes: () => of(false),
            getLoadingRecipesError: () => of(''),
          },
        },
        { provide: StorageFunctions, useValue: {} },
        { provide: ToastService, useValue: { open: (): void => {} } },
        {
          provide: TrainingProgramService,
          useValue: { getMyPrograms: () => Promise.resolve([program]) },
        },
      ],
    });
  });

  for (const [path, card, parameter] of [
    ['meal-prep', '.recipe-card', 'recipe=recipe-1'],
    ['training-program', '.card', 'program=program-1'],
  ]) {
    it(`keeps ${path} active when browser history returns from a detail`, async () => {
      TestBed.inject(Router).setUpLocationChangeListener();
      const harness = await RouterTestingHarness.create(`/${path}`);
      await harness.fixture.whenStable();
      harness.detectChanges();
      const router = TestBed.inject(Router);
      harness.routeNativeElement!.querySelector<HTMLButtonElement>(card)!.click();
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(router.url).toBe(`/${path}?${parameter}`);

      const navigated = firstValueFrom(
        router.events.pipe(filter((event) => event instanceof NavigationEnd)),
      );
      TestBed.inject(Location).back();
      await navigated;
      harness.detectChanges();
      expect(router.url).toBe(`/${path}`);
      expect(harness.routeNativeElement!.querySelector(card)).not.toBeNull();
    });
  }
});
