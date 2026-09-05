import { Component, input } from '@angular/core';
import { UserProfile } from '@models/auth/interfaces';
import { Booking } from '@models/booking/interfaces';
import { AdminAppointmentsListComponent } from '../admin-appointments-list/admin-appointments-list.component';

@Component({
  selector: 'app-data-editer-overview-tab',
  imports: [AdminAppointmentsListComponent],
  templateUrl: './data-editer-overview-tab.component.html',
  styleUrl: './data-editer-overview-tab.component.scss',
})
export class DataEditerOverviewTabComponent {
  selectedUser = input<UserProfile | undefined>(undefined);
  bookings = input<Booking[]>([]);
}
