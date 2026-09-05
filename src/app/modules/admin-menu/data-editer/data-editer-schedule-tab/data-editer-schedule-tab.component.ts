import { Component, input, output } from '@angular/core';
import { Booking } from '@models/booking/interfaces';
import { AdminAppointmentsListComponent } from '../admin-appointments-list/admin-appointments-list.component';

@Component({
  selector: 'app-data-editer-schedule-tab',
  imports: [AdminAppointmentsListComponent],
  templateUrl: './data-editer-schedule-tab.component.html',
  styleUrl: './data-editer-schedule-tab.component.scss',
})
export class DataEditerScheduleTabComponent {
  bookings = input<Booking[]>([]);
  selectedUserUid = input<string | undefined>(undefined);
  selectedBooking = input<Booking | null | undefined>(undefined);
  isDeleteConfirmationOpen = input(false);
  isBookingCommandLoading = input(false);

  bookingSelected = output<string>();
  editRequested = output<void>();
  deleteRequested = output<void>();
  confirmDeleteRequested = output<void>();
  cancelDeleteRequested = output<void>();

  selectBooking(bookingId: string): void {
    this.bookingSelected.emit(bookingId);
  }

  openEdit(): void {
    this.editRequested.emit();
  }

  requestDelete(): void {
    this.deleteRequested.emit();
  }

  confirmDelete(): void {
    this.confirmDeleteRequested.emit();
  }

  cancelDelete(): void {
    this.cancelDeleteRequested.emit();
  }
}
