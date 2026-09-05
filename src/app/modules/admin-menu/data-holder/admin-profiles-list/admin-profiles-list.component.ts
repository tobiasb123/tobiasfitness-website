import { Component, input, output } from '@angular/core';
import { UserProfile } from '@models/auth/interfaces';

@Component({
  selector: 'app-admin-profiles-list',
  templateUrl: './admin-profiles-list.component.html',
  styleUrl: './admin-profiles-list.component.scss',
})
export class AdminProfilesListComponent {
  profiles = input<UserProfile[]>([]);
  hasActiveSearch = input(false);

  profileSelected = output<string>();

  selectProfile(uid: string): void {
    this.profileSelected.emit(uid);
  }
}
