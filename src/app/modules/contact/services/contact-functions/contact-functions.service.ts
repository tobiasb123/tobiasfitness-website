import { inject, Injectable } from '@angular/core';
import { Booking, BookingBase } from '@models/booking/interfaces';
import { FirebaseService } from '@modules/firebase';

@Injectable({
  providedIn: 'root',
})
export class ContactFunctionsService {
  private firbaseService = inject(FirebaseService);

  public async getBookings(): Promise<Booking[]> {
    return this.firbaseService.httpGet<Booking[]>('booking-getBookings');
  }

  public async newBookings(booking: BookingBase): Promise<Booking> {
    return this.firbaseService.httpPost<BookingBase, Booking>('booking-newBooking', booking);
  }
}
