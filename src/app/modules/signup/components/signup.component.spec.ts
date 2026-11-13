import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AUTH_STATE, AuthFunctionsService } from '@modules/auth';
import { FirebaseError } from 'firebase/app';
import { vi } from 'vitest';
import { ToastService } from '../../core/services/toast/toast.service';
import { SignupComponent } from './signup.component';

describe('SignupComponent', () => {
  it('prevents duplicate account creation and restores the button on failure', async () => {
    let rejectSignup: (error: FirebaseError) => void;
    const pending = new Promise<never>((_, reject) => {
      rejectSignup = reject;
    });
    const signUp = vi.fn().mockReturnValue(pending);
    const toastRef = {};
    const toast = { open: vi.fn().mockReturnValue(toastRef), update: vi.fn() };
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    await TestBed.configureTestingModule({
      imports: [SignupComponent],
      providers: [
        provideRouter([]),
        { provide: AUTH_STATE, useValue: signal('loggedOut') },
        { provide: AuthFunctionsService, useValue: { signUp } },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SignupComponent);
    fixture.detectChanges();
    fixture.componentInstance.formGroup.setValue({
      firstname: 'First',
      lastname: 'Last',
      age: 30,
      phonenumber: '12345678',
      street: 'Street',
      postalCode: 1234,
      city: 'City',
      email: 'user@example.com',
      password: 'password',
    });
    fixture.componentInstance.onSubmit(new Event('submit') as SubmitEvent);
    fixture.componentInstance.onSubmit(new Event('submit') as SubmitEvent);
    fixture.detectChanges();
    expect(signUp).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Opretter',
    );
    rejectSignup(new FirebaseError('auth/error', 'Could not create account'));
    await vi.waitFor(() => expect(fixture.componentInstance.isCreatingAccount()).toBe(false));
    expect(toast.update).toHaveBeenCalledWith(toastRef, 'Could not create account', 'error');
    fixture.destroy();
    vi.restoreAllMocks();
  });
});
