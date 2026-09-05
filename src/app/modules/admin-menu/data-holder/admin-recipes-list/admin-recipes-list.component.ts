import { Component, input, output } from '@angular/core';
import { UserProfile } from '@models/auth/interfaces';
import { DocumentFile } from '@models/storage';

@Component({
  selector: 'app-admin-recipes-list',
  templateUrl: './admin-recipes-list.component.html',
  styleUrl: './admin-recipes-list.component.scss',
})
export class AdminRecipesListComponent {
  recipes = input<DocumentFile[]>([]);
  hasActiveSearch = input(false);
  selectedRecipeId = input<string | undefined>(undefined);
  allUsers = input<UserProfile[]>([]);

  recipeSelected = output<string>();

  selectRecipe(recipeId: string): void {
    this.recipeSelected.emit(recipeId);
  }

  isRecipeSelected(recipeId: string): boolean {
    return this.selectedRecipeId() === recipeId;
  }

  getRecipeOwnerLabel(uid: string): string {
    if (!uid || uid === 'all') {
      return 'Alle';
    }

    const user = this.allUsers().find((item) => item.uid === uid);

    if (!user) {
      return 'Ukendt bruger';
    }

    return `${user.firstName} ${user.lastName}`;
  }
}
