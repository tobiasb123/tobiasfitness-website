import { Component, input, output } from '@angular/core';
import { Booking } from '@models/booking/interfaces';

@Component({
  selector: 'app-admin-appointments-list',
  templateUrl: './admin-appointments-list.component.html',
  styleUrl: './admin-appointments-list.component.scss',
})
export class AdminAppointmentsListComponent {
  bookings = input<Booking[]>([]);
  selectedUserUid = input<string | undefined>(undefined);
  clickable = input(false);

  bookingSelected = output<string>();

  selectBooking(bookingId: string): void {
    this.bookingSelected.emit(bookingId);
  }
}
