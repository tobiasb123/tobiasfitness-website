import { Component, input, output } from '@angular/core';
import { Booking } from '@models/booking/interfaces';

@Component({
  selector: 'app-admin-bookings-list',
  templateUrl: './admin-bookings-list.component.html',
  styleUrl: './admin-bookings-list.component.scss',
})
export class AdminBookingsListComponent {
  bookings = input<Booking[]>([]);
  hasActiveSearch = input(false);

  bookingSelected = output<string>();

  selectBooking(uid: string): void {
    this.bookingSelected.emit(uid);
  }
}
