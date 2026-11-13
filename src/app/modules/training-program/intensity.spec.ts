import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TrainingExercise, TrainingProgram } from '@models/training';
import { isValueOnlyIntensityUpdate, parseIntensity } from '@models/training/intensity';
import { vi } from 'vitest';
import { ToastService } from '../core/services/toast/toast.service';
import { TrainingLibraryComponent } from './components/training-library/training-library.component';
import { TrainingProgramEditorComponent } from './components/training-program-editor/training-program-editor.component';
import { TrainingSheetComponent } from './components/training-sheet/training-sheet.component';
import { TrainingProgramService } from './services/training-program.service';

const exercise: TrainingExercise = {
  id: 'exercise-1', name: 'Squat', explanation: '', imageUrl: '', reps: '10', sets: 3,
  intensity: '20 kg', weightUpdatedAt: '', weightUpdatedBy: 'admin',
};
const program: TrainingProgram = {
  id: 'program-1', assignedToUid: 'user-1', status: 'active', title: 'Program',
  clientName: '', injuries: '', goal: '', startDate: '', endDate: '', sessionTime: '',
  tempo: '', rest: '', exercises: [exercise], createdAt: '', updatedAt: '',
};

describe('intensity measurement', () => {
  it('only accepts numeric updates with the existing measurement', () => {
    expect(isValueOnlyIntensityUpdate('20 kg', '25,5 kg')).toBe(true);
    expect(isValueOnlyIntensityUpdate('1/10', '10/10')).toBe(true);
    expect(isValueOnlyIntensityUpdate('1/10', '0/10')).toBe(false);
    expect(isValueOnlyIntensityUpdate('1/10', '11/10')).toBe(false);
    expect(isValueOnlyIntensityUpdate('1/10', '1,5/10')).toBe(false);
    expect(isValueOnlyIntensityUpdate('1/10', '1/5')).toBe(false);
    expect(isValueOnlyIntensityUpdate('30 sek.', '5/10')).toBe(false);
    expect(isValueOnlyIntensityUpdate('20 kg', '1/10')).toBe(false);
    expect(isValueOnlyIntensityUpdate('20 kg', 'Kropsvægt')).toBe(false);
    expect(isValueOnlyIntensityUpdate('20 kg', '25')).toBe(false);
    expect(isValueOnlyIntensityUpdate('Kropsvægt', '20 kg')).toBe(false);
    expect(isValueOnlyIntensityUpdate('Anden værdi', '20 kg')).toBe(false);
    expect(isValueOnlyIntensityUpdate('20 kg', 'kg')).toBe(false);
    expect(parseIntensity('Kropsvægt').unit).toBe('bodyweight');
    expect(parseIntensity('Anden værdi').unit).toBe('legacy');
    expect(parseIntensity('30 sek.')).toEqual({ unit: 'legacy-time', value: '30 sek.' });
    expect(parseIntensity('10/10')).toEqual({ unit: 'time', value: '10' });
    expect(parseIntensity('11/10').unit).toBe('legacy');
  });

  it('edits only the value on the training sheet and displays the fixed unit', async () => {
    await TestBed.configureTestingModule({ imports: [TrainingSheetComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TrainingSheetComponent);
    fixture.componentRef.setInput('program', program);
    fixture.componentRef.setInput('editable', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('td.sets').textContent.trim()).toBe('Sæt: 3');
    expect(fixture.nativeElement.querySelector('td.sets').hasAttribute('data-label')).toBe(false);
    expect(fixture.nativeElement.querySelector('thead').textContent).toContain('Vægt');
    expect(fixture.nativeElement.querySelector('td.intensity').getAttribute('data-label')).toBe('Vægt');
    expect(fixture.nativeElement.querySelector('.edit').textContent).toContain('Ret vægt');
    expect(fixture.nativeElement.querySelector('.edit').getAttribute('aria-label')).toBe('Ret vægt for Squat');
    const changes: string[] = [];
    fixture.componentInstance.weightChange.subscribe((change) => changes.push(change.intensity));
    fixture.nativeElement.querySelector('.edit').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('label[for="weight-exercise-1"]').textContent).toContain('Vægt i kg');
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
    expect(fixture.nativeElement.querySelector('.weight-form').textContent).toContain('kg');
    fixture.componentInstance.weightControl.setValue('30 sek.');
    fixture.componentInstance.saveEdit(exercise);
    expect(changes).toEqual([]);
    fixture.componentInstance.weightControl.setValue('25,5');
    fixture.componentInstance.saveEdit(exercise);
    expect(changes).toEqual(['25,5 kg']);

    const timedExercise = { ...exercise, intensity: '1/10', reps: '10 min' };
    fixture.componentRef.setInput('program', { ...program, exercises: [timedExercise] });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.edit').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.weight-form').textContent).toContain('/10');
    expect(fixture.nativeElement.querySelector('thead').textContent).toContain('Tid');
    expect(fixture.nativeElement.querySelector('thead').textContent).not.toContain('Reps/Tid');
    expect(fixture.nativeElement.querySelector('thead').textContent).toContain('Intensitet');
    expect(fixture.nativeElement.querySelector('td.intensity').getAttribute('data-label')).toBe('Intensitet');
    fixture.componentInstance.weightControl.setValue('11');
    fixture.componentInstance.saveEdit(timedExercise);
    expect(changes).toEqual(['25,5 kg']);
    fixture.componentInstance.weightControl.setValue('10');
    fixture.componentInstance.saveEdit(timedExercise);
    expect(changes).toEqual(['25,5 kg', '10/10']);

    fixture.componentRef.setInput('program', {
      ...program, exercises: [exercise, { ...timedExercise, id: 'timed' }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('thead').textContent).toContain('Reps/Tid');
    expect(fixture.nativeElement.querySelector('thead').textContent).toContain('Vægt/Intensitet');
    expect(fixture.nativeElement.querySelectorAll('.reps-label')[1].textContent).toContain('Tid');
    const intensityLabels: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.intensity-label');
    expect(Array.from(intensityLabels).map((label) => label.textContent?.trim())).toEqual(['Vægt:', 'Intensitet:']);

    fixture.componentRef.setInput('program', {
      ...program, exercises: [
        { ...exercise, intensity: 'Kropsvægt' },
        { ...exercise, id: 'legacy', intensity: 'Anden værdi' },
        { ...exercise, id: 'old-time', intensity: '30 sek.' },
      ],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.edit')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('30 sek.');
  });

  it('requires an explicit rating to convert an old seconds value', async () => {
    const service = {
      exercises: signal([]),
      getAllPrograms: vi.fn().mockResolvedValue([]),
      loadExercises: vi.fn().mockResolvedValue(undefined),
      saveProgram: vi.fn().mockResolvedValue(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [TrainingProgramEditorComponent],
      providers: [
        { provide: TrainingProgramService, useValue: service },
        { provide: ToastService, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TrainingProgramEditorComponent);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    fixture.componentInstance.edit({
      ...program, exercises: [{ ...exercise, intensity: '5 sek.' }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#ex-int-0').value).toBe('5 sek.');
    expect(fixture.nativeElement.querySelector('#ex-int-0').readOnly).toBe(true);
    const group = fixture.componentInstance.exercises.at(0);
    group.controls.intensityUnit.setValue('time');
    expect(group.controls.intensity.value).toBe('');
    await fixture.componentInstance.submit();
    expect(service.saveProgram).not.toHaveBeenCalled();
    group.controls.intensity.setValue('5');
    await fixture.componentInstance.submit();
    expect(service.saveProgram).toHaveBeenCalledWith(expect.objectContaining({
      exercises: [expect.objectContaining({ intensity: '5/10' })],
    }));
    vi.restoreAllMocks();
  });

  it('lets administrators choose and save units without losing old values', async () => {
    const service = {
      exercises: signal([]),
      getAllPrograms: vi.fn().mockResolvedValue([]),
      loadExercises: vi.fn().mockResolvedValue(undefined),
      saveProgram: vi.fn().mockResolvedValue(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [TrainingProgramEditorComponent],
      providers: [
        { provide: TrainingProgramService, useValue: service },
        { provide: ToastService, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TrainingProgramEditorComponent);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    fixture.componentInstance.edit({ ...program, exercises: [
      exercise,
      { ...exercise, id: 'legacy', intensity: 'Anden værdi' },
      { ...exercise, id: 'bodyweight', intensity: 'Kropsvægt' },
      { ...exercise, id: 'old-time', intensity: '30 sek.' },
    ] });
    fixture.detectChanges();
    const options = Array.from(fixture.nativeElement.querySelectorAll('#ex-unit-0 option'))
      .map((option) => (option as HTMLOptionElement).value);
    expect(options).toEqual(['kg', 'time', 'bodyweight']);
    const first = fixture.componentInstance.exercises.at(0);
    expect(fixture.nativeElement.querySelector('label[for="ex-int-0"]').textContent).toBe('Vægt');
    first.controls.intensityUnit.setValue('time');
    first.controls.intensity.setValue('11');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('label[for="ex-int-0"]').textContent).toBe('Intensitet');
    expect(fixture.nativeElement.querySelector('label[for="ex-reps-0"]').textContent).toBe('Tid');
    expect(fixture.nativeElement.querySelector('#ex-int-help-0').textContent).toBe('/10');
    await fixture.componentInstance.submit();
    expect(service.saveProgram).not.toHaveBeenCalled();
    first.controls.intensity.setValue('1');
    await fixture.componentInstance.submit();
    expect(service.saveProgram).toHaveBeenCalledWith(expect.objectContaining({
      exercises: expect.arrayContaining([
        expect.objectContaining({ id: 'exercise-1', intensity: '1/10' }),
        expect.objectContaining({ id: 'legacy', intensity: 'Anden værdi' }),
        expect.objectContaining({ id: 'bodyweight', intensity: 'Kropsvægt' }),
        expect.objectContaining({ id: 'old-time', intensity: '30 sek.' }),
      ]),
    }));
    vi.restoreAllMocks();
  });

  it('lets an administrator change kg exercises between Tid and Reps and persists the selection', async () => {
    const service = {
      exercises: signal([]),
      getAllPrograms: vi.fn().mockResolvedValue([]),
      loadExercises: vi.fn().mockResolvedValue(undefined),
      saveProgram: vi.fn().mockResolvedValue(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [TrainingProgramEditorComponent],
      providers: [
        { provide: TrainingProgramService, useValue: service },
        { provide: ToastService, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TrainingProgramEditorComponent);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    fixture.componentInstance.edit(program);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('label[for="ex-reps-0"]');
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('.choice-buttons button');
    expect(label.textContent).toBe('Reps');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    buttons[0].click();
    fixture.detectChanges();
    expect(label.textContent).toBe('Tid');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
    await fixture.componentInstance.submit();
    expect(service.saveProgram).toHaveBeenCalledWith(expect.objectContaining({
      exercises: [expect.objectContaining({ intensity: '20 kg', repsType: 'time' })],
    }));
    fixture.componentInstance.edit({ ...program, exercises: [{ ...exercise, repsType: 'time' }] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('label[for="ex-reps-0"]').textContent).toBe('Tid');
    fixture.nativeElement.querySelectorAll('.choice-buttons button')[1].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('label[for="ex-reps-0"]').textContent).toBe('Reps');
    vi.restoreAllMocks();
  });

  it('validates edited Reps and Tid values while preserving unchanged legacy text', async () => {
    const service = {
      exercises: signal([]),
      getAllPrograms: vi.fn().mockResolvedValue([]),
      loadExercises: vi.fn().mockResolvedValue(undefined),
      saveProgram: vi.fn().mockResolvedValue(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [TrainingProgramEditorComponent],
      providers: [
        { provide: TrainingProgramService, useValue: service },
        { provide: ToastService, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TrainingProgramEditorComponent);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    fixture.componentInstance.edit({
      ...program,
      exercises: [{ ...exercise, reps: '10 min', repsType: 'time' }],
    });
    fixture.detectChanges();
    const control = fixture.componentInstance.exercises.at(0).controls.reps;
    expect(control.valid).toBe(true);
    control.setValue('15 min');
    await fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(service.saveProgram).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#ex-reps-error-0').textContent).toContain('Indtast kun et tal');
    control.setValue('15,5');
    await fixture.componentInstance.submit();
    expect(service.saveProgram).toHaveBeenCalledWith(expect.objectContaining({
      exercises: [expect.objectContaining({ reps: '15,5', repsType: 'time' })],
    }));
    vi.restoreAllMocks();
  });

  it('requires numeric duration when the measurement is Tid', async () => {
    const service = {
      exercises: signal([]),
      getAllPrograms: vi.fn().mockResolvedValue([]),
      loadExercises: vi.fn().mockResolvedValue(undefined),
      saveProgram: vi.fn().mockResolvedValue(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [TrainingProgramEditorComponent],
      providers: [
        { provide: TrainingProgramService, useValue: service },
        { provide: ToastService, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TrainingProgramEditorComponent);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    fixture.componentInstance.edit({
      ...program, exercises: [{ ...exercise, intensity: '5/10', reps: '10' }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('label[for="ex-reps-0"]').textContent).toBe('Tid');
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#ex-reps-0');
    expect(input.inputMode).toBe('decimal');
    input.value = '15 min';
    input.dispatchEvent(new Event('input'));
    await fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(service.saveProgram).not.toHaveBeenCalled();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    input.value = '15';
    input.dispatchEvent(new Event('input'));
    await fixture.componentInstance.submit();
    expect(service.saveProgram).toHaveBeenCalledWith(expect.objectContaining({
      exercises: [expect.objectContaining({ reps: '15', intensity: '5/10' })],
    }));
    vi.restoreAllMocks();
  });

  it('carries a library exercise type into a new program', async () => {
    const item = {
      id: 'template-1', uid: 'user-1', filePath: '', fileType: 'exercise' as const,
      fileName: '', folderPath: '', fileUrl: '', timeCreated: '',
      exercise: { name: 'Squat', explanation: '', reps: '10 min', sets: 3, intensity: '20 kg', repsType: 'time' as const },
    };
    const service = {
      exercises: signal([item]),
      getAllPrograms: vi.fn().mockResolvedValue([]),
      loadExercises: vi.fn().mockResolvedValue(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [TrainingProgramEditorComponent],
      providers: [
        { provide: TrainingProgramService, useValue: service },
        { provide: ToastService, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TrainingProgramEditorComponent);
    fixture.componentInstance.selectedIds.set([item.id]);
    fixture.componentInstance.addFromLibrary();
    fixture.detectChanges();
    expect(fixture.componentInstance.exercises.at(0).controls.repsType.value).toBe('time');
    expect(fixture.nativeElement.querySelector('label[for="ex-reps-0"]').textContent).toBe('Tid');
  });

  it('displays the correct kg exercise labels in uniform and mixed programs', async () => {
    await TestBed.configureTestingModule({ imports: [TrainingSheetComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TrainingSheetComponent);
    fixture.componentRef.setInput('program', program);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('thead').textContent).toContain('Reps');
    expect(fixture.nativeElement.querySelector('thead').textContent).not.toContain('Reps/Tid');
    fixture.componentRef.setInput('program', {
      ...program, exercises: [{ ...exercise, repsType: 'time' }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('thead').textContent).toContain('Tid');
    expect(fixture.nativeElement.querySelector('td.stat').getAttribute('data-label')).toBe('Tid');
    fixture.componentRef.setInput('program', {
      ...program, exercises: [exercise, { ...exercise, id: 'timed', repsType: 'time' }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('thead').textContent).toContain('Reps/Tid');
    const labels: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.reps-label');
    expect(Array.from(labels).map((label) => label.textContent?.trim())).toEqual(['Reps:', 'Tid:']);
    expect(fixture.nativeElement.querySelector('.choice-buttons')).toBeNull();
  });

  it('offers the same measurement choices in the exercise library', async () => {
    const service = {
      exercises: signal([]),
      loadExercises: vi.fn().mockResolvedValue(undefined),
      updateExercise: vi.fn().mockResolvedValue(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [TrainingLibraryComponent],
      providers: [
        { provide: TrainingProgramService, useValue: service },
        { provide: ToastService, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TrainingLibraryComponent);
    fixture.detectChanges();
    const options = Array.from(fixture.nativeElement.querySelectorAll('#ex-intensity-unit option'))
      .map((option) => (option as HTMLOptionElement).value);
    expect(options).toEqual(['kg', 'time', 'bodyweight']);
    expect(fixture.nativeElement.querySelector('#ex-intensity')).toBeNull();
    fixture.componentInstance.form.controls.intensityUnit.setValue('kg');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#ex-intensity')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('label[for="ex-intensity"]').textContent).toBe('Standard vægt');
    expect(fixture.nativeElement.querySelector('label[for="ex-reps"]').textContent).toBe('Reps');
    fixture.nativeElement.querySelector('.choice-buttons button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('label[for="ex-reps"]').textContent).toBe('Tid');
    fixture.componentInstance.edit({
      id: 'legacy',
      uid: 'user-1', filePath: '', fileType: 'exercise', fileName: '', folderPath: '',
      fileUrl: '', timeCreated: '',
      exercise: { name: 'Squat', explanation: '', reps: '10', sets: 3, intensity: 'Anden værdi' },
    });
    fixture.componentInstance.form.controls.intensityUnit.setValue('time');
    fixture.componentInstance.form.controls.intensity.setValue('5');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('label[for="ex-reps"]').textContent).toBe('Tid');
    expect(fixture.nativeElement.querySelector('label[for="ex-intensity"]').textContent).toBe('Standard intensitet');
    expect(fixture.nativeElement.querySelector('#ex-intensity-help').textContent).toBe('/10');
    await fixture.componentInstance.submit();
    expect(service.updateExercise).toHaveBeenCalledWith(expect.objectContaining({
      exercise: expect.objectContaining({ intensity: '5/10' }),
    }));
  });

  it('saves and restores the kg exercise type in the library', async () => {
    const service = {
      exercises: signal([]),
      loadExercises: vi.fn().mockResolvedValue(undefined),
      updateExercise: vi.fn().mockResolvedValue(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [TrainingLibraryComponent],
      providers: [
        { provide: TrainingProgramService, useValue: service },
        { provide: ToastService, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TrainingLibraryComponent);
    fixture.detectChanges();
    fixture.componentInstance.edit({
      id: 'kg', uid: 'user-1', filePath: '', fileType: 'exercise', fileName: '',
      folderPath: '', fileUrl: '', timeCreated: '',
      exercise: { name: 'Squat', explanation: '', reps: '10', sets: 3, intensity: '20 kg', repsType: 'time' },
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('label[for="ex-reps"]').textContent).toBe('Tid');
    expect(fixture.nativeElement.querySelector('.choice-buttons button').getAttribute('aria-pressed')).toBe('true');
    await fixture.componentInstance.submit();
    expect(service.updateExercise).toHaveBeenCalledWith(expect.objectContaining({
      exercise: expect.objectContaining({ intensity: '20 kg', repsType: 'time' }),
    }));
  });

  it('validates library Reps/Tid input and resets to a numeric default', async () => {
    const service = {
      exercises: signal([]),
      loadExercises: vi.fn().mockResolvedValue(undefined),
      updateExercise: vi.fn().mockResolvedValue(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [TrainingLibraryComponent],
      providers: [
        { provide: TrainingProgramService, useValue: service },
        { provide: ToastService, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TrainingLibraryComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.reps.value).toBe('10');
    fixture.componentInstance.edit({
      id: 'legacy', uid: 'user-1', filePath: '', fileType: 'exercise', fileName: '',
      folderPath: '', fileUrl: '', timeCreated: '',
      exercise: { name: 'Squat', explanation: '', reps: '10 Reps', sets: 3, intensity: '20 kg' },
    });
    const control = fixture.componentInstance.form.controls.reps;
    expect(control.valid).toBe(true);
    control.setValue('12 Reps');
    await fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(service.updateExercise).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#ex-reps-error').textContent).toContain('Indtast kun et tal');
    control.setValue('12');
    await fixture.componentInstance.submit();
    expect(service.updateExercise).toHaveBeenCalledWith(expect.objectContaining({
      exercise: expect.objectContaining({ reps: '12' }),
    }));
    expect(fixture.componentInstance.form.controls.reps.value).toBe('10');
    expect(fixture.componentInstance.form.controls.reps.valid).toBe(true);
  });
});
