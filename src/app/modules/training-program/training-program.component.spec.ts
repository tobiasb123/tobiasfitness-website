import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { UserProfile } from '@models/auth/interfaces';
import { TrainingProgram } from '@models/training';
import { AuthFunctionsService } from '@modules/auth';
import { toPng } from 'html-to-image';
import { filter, firstValueFrom, of } from 'rxjs';
import { AdminFacade } from '../admin-menu';
import { ToastService } from '../core/services/toast/toast.service';
import { TrainingProgramService } from './services/training-program.service';
import { TrainingProgramComponent } from './training-program.component';

vi.mock('html-to-image', () => ({ toPng: vi.fn() }));

describe('TrainingProgramComponent', () => {
  let fixture: ComponentFixture<TrainingProgramComponent>;
  const adminUser: UserProfile = {
    uid: 'admin',
    email: 'admin@example.com',
    admin: true,
    firstName: 'Admin',
    lastName: 'User',
    age: 30,
    phoneNumber: '12345678',
    address: { city: 'København', postalCode: 1000, street: 'Testvej 1' },
  };
  const profile = signal<UserProfile>(adminUser);
  const authFunctions = { currentUserProfile: profile };
  const adminFacade = { getUsers: vi.fn(() => of([adminUser])) };
  const service = {
    getMyPrograms: vi.fn().mockResolvedValue([]),
    getAllPrograms: vi.fn().mockResolvedValue([]),
    updateMyExerciseWeight: vi.fn(),
    updateAnyExerciseIntensity: vi.fn(),
    getProgramImages: vi.fn(),
  };
  const toast = { open: vi.fn() };

  async function historyNavigation(action: () => void): Promise<void> {
    const navigation = firstValueFrom(
      TestBed.inject(Router).events.pipe(filter((event) => event instanceof NavigationEnd)),
    );
    action();
    await navigation;
    fixture.detectChanges();
  }

  function program(id: string): TrainingProgram {
    return {
      id,
      assignedToUid: 'admin',
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
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    profile.set(adminUser);

    await TestBed.configureTestingModule({
      imports: [TrainingProgramComponent],
      providers: [
        provideRouter([{ path: '', children: [] }]),
        provideLocationMocks(),
        { provide: AuthFunctionsService, useValue: authFunctions },
        { provide: AdminFacade, useValue: adminFacade },
        { provide: TrainingProgramService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();
    const router = TestBed.inject(Router);
    router.initialNavigation();
    await router.navigateByUrl('/');

    fixture = TestBed.createComponent(TrainingProgramComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows an accessible switch below the Mine programmer tab', () => {
    const tabs = fixture.nativeElement.querySelector('.tabs');
    const switchLabel = fixture.nativeElement.querySelector('.program-switch');
    const programSwitch = fixture.nativeElement.querySelector('[role="switch"]');

    expect(tabs.textContent).toContain('Mine programmer');
    expect(tabs.nextElementSibling).toBe(switchLabel);
    expect(programSwitch.checked).toBe(false);
  });

  it('loads all programs when the switch is enabled', async () => {
    const programSwitch: HTMLInputElement =
      fixture.nativeElement.querySelector('[role="switch"]');

    programSwitch.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(service.getAllPrograms).toHaveBeenCalledOnce();
    expect(programSwitch.checked).toBe(true);
  });

  it('navigates between a program and its list using browser history', async () => {
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);
    fixture.componentInstance.programs.set([program('program-1')]);
    fixture.componentInstance.showArchived.set(true);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.card').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.parseUrl(router.url).queryParams['program']).toBe('program-1');
    expect(fixture.nativeElement.querySelector('app-training-sheet')).not.toBeNull();

    fixture.componentInstance.previewUrl.set('data:image/png;base64,dGVzdA==');
    await historyNavigation(() => location.back());
    expect(fixture.componentInstance.previewUrl()).toBeNull();
    expect(fixture.componentInstance.showArchived()).toBe(true);
    expect(fixture.nativeElement.querySelector('.card')).not.toBeNull();

    await historyNavigation(() => location.forward());
    expect(fixture.nativeElement.querySelector('app-training-sheet')).not.toBeNull();
  });

  it('opens a direct program link and closes it without leaving the page', async () => {
    fixture.componentInstance.programs.set([program('program-1')]);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/?program=program-1');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-training-sheet')).not.toBeNull();

    fixture.nativeElement.querySelector('.toggle-all').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/');
    expect(fixture.nativeElement.querySelector('.card')).not.toBeNull();
  });

  it('uses the existing back button to return to the program list', async () => {
    fixture.componentInstance.programs.set([program('program-1')]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.card').click();
    await fixture.whenStable();
    fixture.detectChanges();

    await historyNavigation(() => fixture.nativeElement.querySelector('.toggle-all').click());
    expect(TestBed.inject(Router).url).toBe('/');
    expect(fixture.nativeElement.querySelector('.card')).not.toBeNull();
  });

  it('shows an unavailable message for an unknown program', async () => {
    await TestBed.inject(Router).navigateByUrl('/?program=missing');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'ikke tilgængeligt',
    );
    expect(fixture.nativeElement.querySelector('app-training-sheet')).toBeNull();
  });

  it('treats an empty program ID as an unavailable detail link', async () => {
    await TestBed.inject(Router).navigateByUrl('/?program=');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'ikke tilgængeligt',
    );
    expect(fixture.nativeElement.querySelector('.toggle-all')).not.toBeNull();
  });

  it('resolves a direct program link after programs finish loading', async () => {
    fixture.componentInstance.loading.set(true);
    await TestBed.inject(Router).navigateByUrl('/?program=program-1');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Henter dine træningsprogrammer');
    expect(fixture.nativeElement.querySelector('.toggle-all')).not.toBeNull();

    fixture.componentInstance.programs.set([program('program-1')]);
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-training-sheet')).not.toBeNull();
  });

  it('does not reopen an old preview after leaving and returning to a program', async () => {
    const location = TestBed.inject(Location);
    fixture.componentInstance.programs.set([program('program-1')]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.card').click();
    await fixture.whenStable();
    fixture.detectChanges();

    const sheet: HTMLElement = fixture.nativeElement.querySelector('app-training-sheet').parentElement;
    Object.defineProperties(sheet, {
      scrollWidth: { value: 360 },
      scrollHeight: { value: 800 },
    });
    service.getProgramImages.mockResolvedValue({});
    let finishExport!: (value: string) => void;
    let exportStarted!: () => void;
    const started = new Promise<void>((resolve) => { exportStarted = resolve; });
    vi.mocked(toPng).mockImplementation(() => {
      exportStarted();
      return new Promise<string>((resolve) => { finishExport = resolve; });
    });

    const exporting = fixture.componentInstance.createPng();
    await started;
    await historyNavigation(() => location.back());
    await historyNavigation(() => location.forward());
    finishExport('data:image/png;base64,cHJldmlldw==');
    await exporting;
    expect(fixture.componentInstance.previewUrl()).toBeNull();
  });

  it('uses the admin update endpoint when an admin changes intensity', async () => {
    const program: TrainingProgram = {
      id: 'program-1',
      assignedToUid: 'client-1',
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
    service.updateAnyExerciseIntensity.mockResolvedValue(program);
    fixture.componentInstance.programs.set([program]);
    fixture.componentInstance.selectedId.set(program.id);

    await fixture.componentInstance.saveWeight({
      exerciseId: 'exercise-1',
      intensity: '20 kg',
    });

    expect(service.updateAnyExerciseIntensity).toHaveBeenCalledWith({
      programId: program.id,
      exerciseId: 'exercise-1',
      intensity: '20 kg',
    });
    expect(service.updateMyExerciseWeight).not.toHaveBeenCalled();
  });

  it('captures the displayed sheet with the server-provided exercise image', async () => {
    const program: TrainingProgram = {
      id: 'program-1',
      assignedToUid: 'admin',
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
      exercises: [{
        id: 'exercise-1',
        name: 'Squat',
        explanation: '',
        imageUrl: 'https://example.com/image.png',
        reps: '10',
        sets: 3,
        intensity: '20 kg',
        weightUpdatedAt: '',
        weightUpdatedBy: 'client',
      }],
      createdAt: '',
      updatedAt: '',
    };
    const dataUrl = 'data:image/png;base64,dGVzdA==';
    service.getProgramImages.mockResolvedValue({ 'exercise-1': dataUrl });
    fixture.componentInstance.programs.set([program]);
    fixture.componentInstance.selectedId.set(program.id);
    fixture.detectChanges();

    const sheet: HTMLElement = fixture.nativeElement.querySelector('app-training-sheet').parentElement;
    const image = sheet.querySelector('img')!;
    image.decode = vi.fn().mockResolvedValue(undefined);
    Object.defineProperties(sheet, {
      scrollWidth: { value: 360 },
      scrollHeight: { value: 800 },
    });
    vi.mocked(toPng).mockImplementation(async (node) => {
      expect(node).toBe(sheet);
      expect(node.querySelector('img')?.src).toBe(dataUrl);
      return 'data:image/png;base64,cHJldmlldw==';
    });

    await fixture.componentInstance.createPng();

    expect(service.getProgramImages).toHaveBeenCalledWith(program.id);
    expect(toPng).toHaveBeenCalledWith(
      sheet,
      expect.objectContaining({ width: 360, height: 800 }),
    );
    expect(fixture.componentInstance.previewUrl()).toBe('data:image/png;base64,cHJldmlldw==');
    expect(fixture.componentInstance.exportImages()).toBeNull();
    expect(toast.open).not.toHaveBeenCalled();
  });

  it('reports an unavailable exercise image instead of exporting an incomplete program', async () => {
    const program: TrainingProgram = {
      id: 'program-1',
      assignedToUid: 'admin',
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
      exercises: [{
        id: 'exercise-1',
        name: 'Squat',
        explanation: '',
        imageUrl: 'https://example.com/image.png',
        reps: '10',
        sets: 3,
        intensity: '20 kg',
        weightUpdatedAt: '',
        weightUpdatedBy: 'client',
      }],
      createdAt: '',
      updatedAt: '',
    };
    service.getProgramImages.mockResolvedValue({});
    fixture.componentInstance.programs.set([program]);
    fixture.componentInstance.selectedId.set(program.id);
    fixture.detectChanges();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      await fixture.componentInstance.createPng();

      expect(toPng).not.toHaveBeenCalled();
      expect(toast.open).toHaveBeenCalledWith(
        'Et eller flere øvelsesbilleder kunne ikke hentes til billedet',
        'error',
      );
      expect(fixture.componentInstance.exporting()).toBe(false);
    } finally {
      consoleError.mockRestore();
    }
  });
});
