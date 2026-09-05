import { Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-stats',
  templateUrl: './admin-stats.component.html',
  styleUrl: './admin-stats.component.scss',
})
export class AdminStatsComponent {
  usersCount = input(0);
  bookingsCount = input(0);
  recipesCount = input(0);
  selectedUserInitial = input('—');
}
