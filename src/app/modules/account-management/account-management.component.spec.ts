import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UserProfile } from '@models/auth/interfaces';
import { Booking } from '@models/booking/interfaces';
import { AuthFunctionsService } from '@modules/auth';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';
import { BookingFacade, ContactFunctionsService } from '../contact';
import { ToastService } from '../core/services/toast/toast.service';
import { AccountManagementComponent } from './account-management.component';

describe('AccountManagementComponent bookings', () => {
  const profile: UserProfile = {
    uid: 'user-1',
    email: 'user@example.com',
    firstName: 'First',
    lastName: 'Last',
    age: 30,
    phoneNumber: '',
    address: { street: '', postalCode: 1234, city: '' },
  };
  const booking = (id: string, uid: string, date: string): Booking => ({
    id,
    uid,
    date,
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    service: '',
    timePeriod: { start: { hour: '09', minute: '00' }, end: { hour: '10', minute: '00' } },
  });

  it('subscribes once, updates for profile changes and unsubscribes on destroy', async () => {
    const currentUserProfile = signal<UserProfile | undefined>(undefined);
    const bookings = new BehaviorSubject<Booking[]>([
      booking('later', 'user-1', '2026-03-01'),
      booking('other', 'user-2', '2026-01-01'),
      booking('earlier', 'user-1', '2026-02-01'),
    ]);
    const getBookings = vi.fn(() => bookings.asObservable());
    const updateDetails = vi.fn().mockResolvedValue({ ...profile, firstName: 'Updated' });

    await TestBed.configureTestingModule({
      imports: [AccountManagementComponent],
      providers: [
        { provide: AuthFunctionsService, useValue: { currentUserProfile, updateDetails } },
        { provide: BookingFacade, useValue: { getBookings } },
        {
          provide: ContactFunctionsService,
          useValue: { getBookingAvailability: vi.fn().mockResolvedValue({ timePeriods: [] }) },
        },
        { provide: ToastService, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AccountManagementComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(getBookings).not.toHaveBeenCalled();

    currentUserProfile.set(profile);
    fixture.detectChanges();

    expect(fixture.componentInstance.bookings().map((item) => item.id)).toEqual([
      'earlier',
      'later',
    ]);
    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    expect(getBookings).toHaveBeenCalledTimes(1);
    expect(bookings.observers).toHaveLength(1);

    currentUserProfile.set({ ...profile, uid: 'user-2' });
    fixture.detectChanges();
    expect(fixture.componentInstance.bookings().map((item) => item.id)).toEqual(['other']);
    bookings.next([booking('new', 'user-2', '2026-04-01')]);
    expect(fixture.componentInstance.bookings().map((item) => item.id)).toEqual(['new']);
    currentUserProfile.set(undefined);
    fixture.detectChanges();
    expect(fixture.componentInstance.bookings()).toEqual([]);
    expect(getBookings).toHaveBeenCalledTimes(1);

    fixture.destroy();
    expect(bookings.observers).toHaveLength(0);
  });

  it('warns when availability cannot be loaded', async () => {
    const toast = { open: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [AccountManagementComponent],
      providers: [
        { provide: AuthFunctionsService, useValue: { currentUserProfile: signal(undefined) } },
        { provide: BookingFacade, useValue: { getBookings: () => new BehaviorSubject([]) } },
        {
          provide: ContactFunctionsService,
          useValue: { getBookingAvailability: vi.fn().mockRejectedValue(new Error('Unavailable')) },
        },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AccountManagementComponent);
    fixture.detectChanges();
    await vi.waitFor(() =>
      expect(toast.open).toHaveBeenCalledWith(
        'Bookingstiderne kunne ikke hentes. Standardtider vises.',
        'warning',
      ),
    );
    fixture.destroy();
  });

  it('prevents duplicate profile saves and re-enables saving after failure', async () => {
    let rejectSave: (error: Error) => void;
    const pending = new Promise<never>((_, reject) => {
      rejectSave = reject;
    });
    const updateDetails = vi.fn().mockReturnValue(pending);
    const toast = { open: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [AccountManagementComponent],
      providers: [
        {
          provide: AuthFunctionsService,
          useValue: { currentUserProfile: signal(profile), updateDetails },
        },
        { provide: BookingFacade, useValue: { getBookings: () => new BehaviorSubject([]) } },
        {
          provide: ContactFunctionsService,
          useValue: { getBookingAvailability: vi.fn().mockResolvedValue({ timePeriods: [] }) },
        },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AccountManagementComponent);
    fixture.detectChanges();
    void fixture.componentInstance.onSubmit();
    void fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    expect(updateDetails).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('.save-button').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Gemmer');
    rejectSave(new Error('Unavailable'));
    await vi.waitFor(() => expect(fixture.componentInstance.isSavingProfile()).toBe(false));
    expect(toast.open).toHaveBeenCalledWith('Bruger kunne ikke gemmes', 'error');
    fixture.destroy();
  });
});
