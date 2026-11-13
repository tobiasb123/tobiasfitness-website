import { TestBed } from '@angular/core/testing';
import { FirebaseService } from '@modules/firebase';
import { vi } from 'vitest';
import { ContactFunctionsService } from './contact-functions.service';

describe('ContactFunctionsService', () => {
  it('propagates availability and booked-slot errors to the caller', async () => {
    const error = new Error('Unavailable');
    const firebase = { httpGetPublic: vi.fn().mockRejectedValue(error) };
    TestBed.configureTestingModule({
      providers: [{ provide: FirebaseService, useValue: firebase }],
    });
    const service = TestBed.inject(ContactFunctionsService);

    await expect(service.getBookingAvailability()).rejects.toBe(error);
    await expect(service.getBookedSlots()).rejects.toBe(error);
    expect(firebase.httpGetPublic).toHaveBeenCalledWith('booking-getAvailability');
    expect(firebase.httpGetPublic).toHaveBeenCalledWith('booking-getBookedSlots');
  });
});
