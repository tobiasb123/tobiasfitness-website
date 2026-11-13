import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthFacade } from '@modules/auth';
import { vi } from 'vitest';
import { ToastService } from '../core/services/toast/toast.service';
import { StorageFunctions } from '../meal-prep/services/storage-functions.service';
import { CreateReviewComponent } from './create-review.component';

describe('CreateReviewComponent image upload', () => {
  it('offers a focusable upload button and displays the selected file', async () => {
    await TestBed.configureTestingModule({
      imports: [CreateReviewComponent],
      providers: [
        { provide: StorageFunctions, useValue: {} },
        { provide: AuthFacade, useValue: { currentProfile: signal(null) } },
        { provide: ToastService, useValue: { open: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CreateReviewComponent);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('#uploadBtn');
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#fileInput');
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});
    button.focus();
    expect(document.activeElement).toBe(button);
    button.click();
    expect(click).toHaveBeenCalledOnce();
    Object.defineProperty(input, 'files', { value: [new File(['image'], 'photo.png')] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#fileName').textContent).toContain('photo.png');
  });

  it.each(['synchronous', 'asynchronous'])(
    'surfaces %s upload failures and re-enables submission',
    async (failure) => {
      const saveReview = vi.fn(() => {
        if (failure === 'synchronous') {
          throw new Error('Upload failed');
        }
        return { promise: Promise.reject(new Error('Upload failed')) };
      });
      const toast = { open: vi.fn() };
      await TestBed.configureTestingModule({
        imports: [CreateReviewComponent],
        providers: [
          { provide: StorageFunctions, useValue: { saveReview } },
          {
            provide: AuthFacade,
            useValue: {
              currentProfile: signal({ uid: 'user-1', age: 30, firstName: 'A', lastName: 'B' }),
            },
          },
          { provide: ToastService, useValue: toast },
          { provide: Router, useValue: { navigate: vi.fn() } },
        ],
      }).compileComponents();
      const fixture = TestBed.createComponent(CreateReviewComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      const input: HTMLInputElement = fixture.nativeElement.querySelector('#fileInput');
      Object.defineProperty(input, 'files', { value: [new File(['image'], 'photo.png')] });
      component.imageControl.setValue('photo.png', { emitModelToViewChange: false });
      component.reviewControl.setValue('Review');
      component.ratingControl.setValue(5);
      component.onSubmit(input);
      await vi.waitFor(() => expect(toast.open).toHaveBeenCalledWith('Upload failed', 'error'));
      expect(toast.open).toHaveBeenCalledWith('Upload failed', 'error');
      expect(component.isUploading()).toBe(false);
    },
  );

  it('reports a missing profile instead of starting an upload', async () => {
    const saveReview = vi.fn();
    const toast = { open: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [CreateReviewComponent],
      providers: [
        { provide: StorageFunctions, useValue: { saveReview } },
        { provide: AuthFacade, useValue: { currentProfile: signal(null) } },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CreateReviewComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#fileInput');
    Object.defineProperty(input, 'files', { value: [new File(['image'], 'photo.png')] });
    component.imageControl.setValue('photo.png', { emitModelToViewChange: false });
    component.reviewControl.setValue('Review');
    component.ratingControl.setValue(5);
    component.onSubmit(input);
    expect(saveReview).not.toHaveBeenCalled();
    expect(toast.open).toHaveBeenCalledWith(
      'Du skal være logget ind for at oprette en anmeldelse.',
      'error',
    );
  });

  it('shows real upload progress, prevents duplicates and clears state on failure', async () => {
    let reportProgress: (snapshot: { bytesTransferred: number; totalBytes: number }) => void;
    let rejectUpload: (error: Error) => void;
    const pending = new Promise<never>((_, reject) => {
      rejectUpload = reject;
    });
    const saveReview = vi.fn((_file, _review, _uid, onProgress) => {
      reportProgress = onProgress;
      return { promise: pending };
    });
    const toast = { open: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [CreateReviewComponent],
      providers: [
        { provide: StorageFunctions, useValue: { saveReview } },
        {
          provide: AuthFacade,
          useValue: {
            currentProfile: signal({ uid: 'user-1', age: 30, firstName: 'A', lastName: 'B' }),
          },
        },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CreateReviewComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#fileInput');
    Object.defineProperty(input, 'files', { value: [new File(['image'], 'photo.png')] });
    component.imageControl.setValue('photo.png', { emitModelToViewChange: false });
    component.reviewControl.setValue('Review');
    component.ratingControl.setValue(5);
    component.onSubmit(input);
    component.onSubmit(input);
    fixture.detectChanges();
    expect(saveReview).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('progress')).toBeNull();
    reportProgress({ bytesTransferred: 50, totalBytes: 100 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('progress').value).toBe(50);
    reportProgress({ bytesTransferred: 100, totalBytes: 100 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Gemmer anmeldelsen',
    );
    rejectUpload(new Error('Upload failed'));
    await vi.waitFor(() => expect(component.isUploading()).toBe(false));
    expect(component.uploadProgress()).toBeNull();
    expect(toast.open).toHaveBeenCalledWith('Upload failed', 'error');
  });
});
