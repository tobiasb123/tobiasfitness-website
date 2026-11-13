import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AUTH_STATE, AuthFunctionsService } from '@modules/auth';
import { vi } from 'vitest';
import { ToastService } from './modules/core/services/toast/toast.service';
import { routes } from './app.routes';

describe('lazy routes', () => {
  it('resolves every configured page', async () => {
    const components = await Promise.all(routes.map((route) => route.loadComponent!()));
    expect(components.every((component) => typeof component === 'function')).toBe(true);
  });

  it('navigates between sign-in and sign-up pages', async () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: AUTH_STATE, useValue: signal('ready') },
        { provide: AuthFunctionsService, useValue: {} },
        { provide: ToastService, useValue: {} },
      ],
    }).compileComponents();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/signin');
    expect(harness.routeNativeElement?.textContent).toContain('Log Ind');
    await harness.navigateByUrl('/signup');
    expect(harness.routeNativeElement?.textContent).toContain('Opret Konto');
    vi.restoreAllMocks();
  });
});
