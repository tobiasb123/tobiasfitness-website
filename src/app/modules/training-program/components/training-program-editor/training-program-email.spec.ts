import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TrainingProgram } from '@models/training';
import { vi } from 'vitest';
import { ToastService } from '../../../core/services/toast/toast.service';
import { TrainingProgramService } from '../../services/training-program.service';
import { TrainingProgramEditorComponent } from './training-program-editor.component';

const program: TrainingProgram = {
  id: 'program-1', assignedToUid: 'client', status: 'active', title: 'Program',
  clientName: 'Client', injuries: '', goal: '', startDate: '', endDate: '', sessionTime: '',
  tempo: '', rest: '', exercises: [], createdAt: '', updatedAt: '',
};

describe('program update email choice', () => {
  let fixture: ComponentFixture<TrainingProgramEditorComponent>;
  let dialog: HTMLDialogElement;
  const service = {
    exercises: signal([]),
    getAllPrograms: vi.fn().mockResolvedValue([]),
    loadExercises: vi.fn().mockResolvedValue(undefined),
    saveProgram: vi.fn(),
    deleteProgram: vi.fn(),
  };
  const toast = { open: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    service.saveProgram.mockResolvedValue(program);
    await TestBed.configureTestingModule({
      imports: [TrainingProgramEditorComponent],
      providers: [
        { provide: TrainingProgramService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TrainingProgramEditorComponent);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    fixture.detectChanges();
    dialog = fixture.nativeElement.querySelector('.email-dialog');
    dialog.showModal = vi.fn(() => { dialog.open = true; });
    dialog.close = vi.fn(() => { dialog.open = false; });
    fixture.componentInstance.edit(program);
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  it.each([true, false])('saves an active update with sendNotification=%s', async (send) => {
    await fixture.componentInstance.submit();
    expect(dialog.showModal).toHaveBeenCalledOnce();
    expect(service.saveProgram).not.toHaveBeenCalled();
    expect(dialog.getAttribute('aria-labelledby')).toBe('email-dialog-title');
    const buttons = dialog.querySelectorAll('button');
    expect(buttons[0].hasAttribute('autofocus')).toBe(true);
    buttons[send ? 0 : 1].click();
    await fixture.whenStable();
    expect(dialog.open).toBe(false);
    expect(service.saveProgram).toHaveBeenCalledWith(expect.objectContaining({
      id: program.id, sendNotification: send,
    }));
  });

  it('cancels without saving', async () => {
    await fixture.componentInstance.submit();
    dialog.querySelectorAll('button')[2].click();
    expect(dialog.open).toBe(false);
    expect(service.saveProgram).not.toHaveBeenCalled();
    expect(fixture.componentInstance.editingId()).toBe(program.id);
  });

  it('does not show the choice for new or archived programs', async () => {
    fixture.componentInstance.form.controls.status.setValue('archived');
    await fixture.componentInstance.submit();
    expect(dialog.showModal).not.toHaveBeenCalled();
    expect(service.saveProgram).toHaveBeenCalledWith(expect.not.objectContaining({ sendNotification: expect.anything() }));
    service.saveProgram.mockClear();
    fixture.componentInstance.form.patchValue({ assignedToUid: 'client', status: 'active', title: 'New' });
    await fixture.componentInstance.submit();
    expect(dialog.showModal).not.toHaveBeenCalled();
    expect(service.saveProgram).toHaveBeenCalledWith(expect.not.objectContaining({ sendNotification: expect.anything() }));
  });

  it('warns when the program was saved but the email failed', async () => {
    service.saveProgram.mockResolvedValue({ ...program, notificationFailed: true });
    await fixture.componentInstance.submit();
    await fixture.componentInstance.confirmEmailChoice(true);
    expect(toast.open).toHaveBeenCalledWith('Træningsprogrammet blev gemt, men mailen kunne ikke sendes', 'warning');
    expect(fixture.componentInstance.editingId()).toBeNull();
  });

  it('prevents duplicate deletions and restores controls after failure', async () => {
    let rejectDelete: (error: Error) => void;
    const pending = new Promise<never>((_, reject) => { rejectDelete = reject; });
    service.deleteProgram.mockReturnValue(pending);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance.programs.set([program]);
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    void fixture.componentInstance.remove(program);
    void fixture.componentInstance.remove(program);
    fixture.detectChanges();
    expect(service.deleteProgram).toHaveBeenCalledOnce();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.list .danger');
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Sletter');
    rejectDelete(new Error('Unavailable'));
    await vi.waitFor(() => expect(fixture.componentInstance.deletingId()).toBeNull());
    expect(toast.open).toHaveBeenCalledWith('Unavailable', 'error');
  });
});
