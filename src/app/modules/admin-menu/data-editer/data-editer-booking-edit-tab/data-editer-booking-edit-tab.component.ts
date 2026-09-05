import { Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-data-editer-booking-edit-tab',
  imports: [ReactiveFormsModule],
  templateUrl: './data-editer-booking-edit-tab.component.html',
  styleUrl: './data-editer-booking-edit-tab.component.scss',
})
export class DataEditerBookingEditTabComponent {
  serviceControl = input.required<FormControl<string | null>>();
  timeControl = input.required<FormControl<string | null>>();
  dateControl = input.required<FormControl<string | null>>();
  hourOptions = input<string[]>([]);
  serviceOptions = input<string[]>([]);
  isBookingCommandLoading = input(false);
  isDeleteConfirmationOpen = input(false);

  saveRequested = output<void>();
  deleteRequested = output<void>();
  backRequested = output<void>();
  confirmDeleteRequested = output<void>();
  cancelDeleteRequested = output<void>();

  save(): void {
    this.saveRequested.emit();
  }

  requestDelete(): void {
    this.deleteRequested.emit();
  }

  goBack(): void {
    this.backRequested.emit();
  }

  confirmDelete(): void {
    this.confirmDeleteRequested.emit();
  }

  cancelDelete(): void {
    this.cancelDeleteRequested.emit();
  }
}
