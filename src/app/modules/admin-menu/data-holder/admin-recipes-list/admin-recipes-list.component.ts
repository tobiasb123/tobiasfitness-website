import { Component, input, output } from '@angular/core';
import { UserProfile } from '@models/auth/interfaces';
import { DocumentFile } from '@models/storage';
import { getRecipeReceiverUids } from '../../../meal-prep/utils/recipe-receivers.util';

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

  getRecipeOwnerLabel(recipe: DocumentFile): string {
    const uids = getRecipeReceiverUids(recipe);

    if (uids.includes('all')) {
      return 'Alle';
    }

    return uids
      .map((uid) => {
        const user = this.allUsers().find((item) => item.uid === uid);
        return user ? `${user.firstName} ${user.lastName}` : 'Ukendt bruger';
      })
      .join(', ');
  }
}
