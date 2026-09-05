import { Component, input, output } from '@angular/core';
import { UserProfile } from '@models/auth/interfaces';

export type AdminView = 'Profiler' | 'Bookinger' | 'Opskrifter';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss',
})
export class AdminSidebarComponent {
  activeView = input<AdminView>('Profiler');
  searchQuery = input('');
  selectedUser = input<UserProfile | undefined>(undefined);
  isLibraryRecipeSelected = input(false);

  viewSelected = output<AdminView>();
  searchChanged = output<string>();
  openEditorRequested = output<void>();

  selectView(view: AdminView): void {
    this.viewSelected.emit(view);
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchChanged.emit(target.value || '');
  }

  openEditer(): void {
    this.openEditorRequested.emit();
  }
}
