import { inject, Injectable } from '@angular/core';
import {
  Booking,
  BookingBase,
  CancelBookingRequest,
  RescheduleBookingRequest,
  Service,
} from '@models/booking/interfaces';
import { FirebaseService } from '@modules/firebase';

@Injectable({
  providedIn: 'root',
})
export class ContactFunctionsService {
  private firbaseService = inject(FirebaseService);

  public async getBookings(): Promise<Booking[]> {
    return this.firbaseService.httpGet<Booking[]>('booking-getBookings');
  }

  public async newBooking(booking: BookingBase): Promise<Booking> {
    return this.firbaseService.httpPost<BookingBase, Booking>('booking-newBooking', booking);
  }

  public async getServices(): Promise<Service[]> {
    return this.firbaseService.httpGet<Service[]>('booking-getServices');
  }

  public async sendRescheduleMail(
    request: RescheduleBookingRequest,
  ): Promise<{ success: boolean }> {
    return this.firbaseService.httpPost<RescheduleBookingRequest, { success: boolean }>(
      'booking-sendRescheduleMail',
      request,
    );
  }

  public async sendCancellationMail(request: CancelBookingRequest): Promise<{ success: boolean }> {
    return this.firbaseService.httpPost<CancelBookingRequest, { success: boolean }>(
      'booking-sendCancellationMail',
      request,
    );
  }
}
