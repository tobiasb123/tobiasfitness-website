import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AUTH_STATE, AuthFunctionsService } from '@modules/auth';
import { ToastService } from '../../core/services/toast/toast.service';

import { SigninComponent } from './signin.component';

describe('SigninComponent', () => {
  let component: SigninComponent;
  let fixture: ComponentFixture<SigninComponent>;
  const authFunctions = {
    signIn: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
  };
  const toast = {
    open: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [SigninComponent],
      providers: [
        { provide: AUTH_STATE, useValue: signal('ready') },
        { provide: AuthFunctionsService, useValue: authFunctions },
        { provide: ToastService, useValue: toast },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SigninComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should require a valid email before requesting a password reset', async () => {
    await component.onResetPassword();

    expect(component.emailControl.touched).toBe(true);
    expect(authFunctions.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('should send a reset email to the entered email address', async () => {
    component.emailControl.setValue('user@example.com');
    authFunctions.sendPasswordResetEmail.mockResolvedValue(undefined);

    await component.onResetPassword();

    expect(authFunctions.sendPasswordResetEmail).toHaveBeenCalledWith('user@example.com');
    expect(toast.update).toHaveBeenCalledWith(
      undefined,
      'Hvis emailen er tilknyttet en konto, modtager du snart et link til at nulstille kodeordet.',
      'success',
    );
  });
});
