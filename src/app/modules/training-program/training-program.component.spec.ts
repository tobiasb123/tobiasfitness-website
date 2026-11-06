import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { UserProfile } from '@models/auth/interfaces';
import { TrainingProgram } from '@models/training';
import { AuthFunctionsService } from '@modules/auth';
import { toPng } from 'html-to-image';
import { of } from 'rxjs';
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

  beforeEach(async () => {
    vi.clearAllMocks();
    profile.set(adminUser);

    await TestBed.configureTestingModule({
      imports: [TrainingProgramComponent],
      providers: [
        { provide: AuthFunctionsService, useValue: authFunctions },
        { provide: AdminFacade, useValue: adminFacade },
        { provide: TrainingProgramService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

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
