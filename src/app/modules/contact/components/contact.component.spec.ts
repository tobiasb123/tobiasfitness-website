import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UserProfile } from '@models/auth/interfaces';
import { AuthFunctionsService } from '@modules/auth';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ToastService } from '../../core/services/toast/toast.service';
import { ContactFunctionsService } from '../services/contact-functions/contact-functions.service';
import { BookingFacade } from '../store/booking.facade';
import { ServicesFacade } from '../store/services.facade';
import { ContactComponent } from './contact.component';

describe('ContactComponent booking availability', () => {
  const profile: UserProfile = {
    uid: 'user-1',
    firstName: 'First',
    lastName: 'Last',
    email: 'user@example.com',
    age: 30,
    phoneNumber: '',
    address: { street: '', postalCode: 1234, city: '' },
  };
  const availability = {
    blockedDays: [3],
    timePeriods: [{ start: { hour: '09', minute: '00' }, end: { hour: '10', minute: '00' } }],
  };

  it.each(['availability', 'slots'])(
    'blocks booking when %s loading fails and enables it after retry',
    async (failedRequest) => {
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      const getBookingAvailability = vi.fn().mockResolvedValue(availability);
      const getBookedSlots = vi.fn().mockResolvedValue([]);
      if (failedRequest === 'availability') {
        getBookingAvailability.mockRejectedValueOnce(new Error('Unavailable'));
      } else {
        getBookedSlots.mockRejectedValueOnce(new Error('Unavailable'));
      }
      const savedBooking = {
        id: 'booking-1',
        uid: profile.uid,
        date: '2026-12-01',
        timePeriod: availability.timePeriods[0],
      };
      let resolveBooking: (value: typeof savedBooking) => void;
      const pendingBooking = new Promise<typeof savedBooking>((resolve) => {
        resolveBooking = resolve;
      });
      const newBooking = vi.fn().mockReturnValue(pendingBooking);
      const bookingFacade = { newBooking: vi.fn() };
      const toast = { open: vi.fn() };
      await TestBed.configureTestingModule({
        imports: [ContactComponent],
        providers: [
          { provide: AuthFunctionsService, useValue: { currentUserProfile: signal(profile) } },
          {
            provide: ContactFunctionsService,
            useValue: { getBookingAvailability, getBookedSlots, newBooking },
          },
          { provide: BookingFacade, useValue: bookingFacade },
          {
            provide: ServicesFacade,
            useValue: {
              getServices: () => of([]),
              isLoadingServices: () => of(false),
              getLoadingServicesError: () => of(''),
            },
          },
          { provide: ToastService, useValue: toast },
        ],
      }).compileComponents();
      const fixture = TestBed.createComponent(ContactComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      await vi.waitFor(() =>
        expect(component.scheduleError()).toBe('Bookingstiderne kunne ikke hentes. Prøv igen.'),
      );
      component.serviceControl.setValue('Training');
      component.dateControl.setValue('2026-12-01');
      component.timeControl.setValue('09:00 - 10:00');
      component.goToSchedule();
      fixture.detectChanges();

      expect(component.scheduleError()).toBe('Bookingstiderne kunne ikke hentes. Prøv igen.');
      expect(component.currentStep()).toBe('schedule');
      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
        'Bookingstiderne kunne ikke hentes',
      );
      expect(fixture.nativeElement.querySelector('#submit-button')).toBeNull();
      component.onSubmit(new Event('submit') as SubmitEvent);
      expect(newBooking).not.toHaveBeenCalled();

      const buttons = fixture.nativeElement.querySelectorAll('[role="alert"] button');
      buttons[1].click();
      expect(component.currentStep()).toBe('service');
      component.goToSchedule();
      fixture.nativeElement.querySelector('[role="alert"] button').click();
      void component.loadSchedule();
      fixture.detectChanges();
      await vi.waitFor(() => expect(component.scheduleLoading()).toBe(false));
      fixture.detectChanges();
      expect(getBookingAvailability).toHaveBeenCalledTimes(2);
      expect(getBookedSlots).toHaveBeenCalledTimes(2);
      expect(fixture.nativeElement.querySelector('#submit-button')).not.toBeNull();

      component.onSubmit(new Event('submit') as SubmitEvent);
      component.onSubmit(new Event('submit') as SubmitEvent);
      fixture.detectChanges();
      expect(newBooking).toHaveBeenCalledOnce();
      expect(fixture.nativeElement.querySelector('#submit-button').disabled).toBe(true);
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
        'Booker',
      );
      resolveBooking(savedBooking);
      await vi.waitFor(() => expect(bookingFacade.newBooking).toHaveBeenCalledOnce());
      await vi.waitFor(() => expect(component.isBooking()).toBe(false));
      expect(newBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: profile.uid,
          date: '2026-12-01',
          timePeriod: availability.timePeriods[0],
        }),
      );
      expect(bookingFacade.newBooking).toHaveBeenCalledOnce();
      expect(toast.open).toHaveBeenCalledWith('Din booking er registreret', 'success');
      fixture.destroy();
      vi.restoreAllMocks();
    },
  );
});
