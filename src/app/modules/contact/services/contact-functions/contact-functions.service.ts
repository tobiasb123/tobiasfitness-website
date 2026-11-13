import { inject, Injectable } from '@angular/core';
import {
  BookedSlot,
  Booking,
  BookingBase,
  BookingAvailability,
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

  public async getBookingAvailability(): Promise<BookingAvailability> {
    return this.firbaseService.httpGetPublic<BookingAvailability>('booking-getAvailability');
  }

  public async getBookedSlots(): Promise<BookedSlot[]> {
    return this.firbaseService.httpGetPublic<BookedSlot[]>('booking-getBookedSlots');
  }

  public async newBooking(booking: BookingBase): Promise<Booking> {
    return this.firbaseService.httpPost<BookingBase, Booking>('booking-newBooking', booking);
  }

  public async getServices(): Promise<Service[]> {
    return this.firbaseService.httpGet<Service[]>('booking-getServices');
  }

  public async createService(service: Service): Promise<Service> {
    return this.firbaseService.httpPost<Service, Service>('booking-createService', service);
  }

  public async updateService(service: Service): Promise<Service> {
    return this.firbaseService.httpPost<Service, Service>('booking-updateService', service);
  }

  public async deleteService(id: string): Promise<{ id: string }> {
    return this.firbaseService.httpPost<{ id: string }, { id: string }>('booking-deleteService', {
      id,
    });
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
