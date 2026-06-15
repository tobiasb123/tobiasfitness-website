import { inject, Injectable } from '@angular/core';
import { Booking } from '@models/booking/interfaces';
import { FirebaseService } from '@modules/firebase';

@Injectable({
  providedIn: 'root',
})
export class AdminFunctionsService {
  private firbaseService = inject(FirebaseService);

  public async deleteBooking(id: string): Promise<{ success: boolean }> {
    return this.firbaseService.httpPost<string, { success: boolean }>('admin-deleteBooking', id);
  }

  public async editBooking(booking: Booking): Promise<{ success: boolean }> {
    return this.firbaseService.httpPost<Booking, { success: boolean }>(
      'admin-editBooking',
      booking,
    );
  }
}
