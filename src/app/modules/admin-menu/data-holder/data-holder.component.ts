import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { Booking } from '@models/booking/interfaces';
import { DocumentFile } from '@models/storage';
import { BookingFacade } from '@modules/booking';
import { RecipesFacade } from '@modules/meal-prep';
import { Subscription } from 'rxjs';
import { DataEditerComponent } from '../data-editer/data-editer.component';
import { RecipeEditerComponent } from '../recipe-editer/recipe-editer.component';
import { AdminFacade } from '../store/admin.facade';
import { AdminBookingsListComponent } from './admin-bookings-list/admin-bookings-list.component';
import { AdminProfilesListComponent } from './admin-profiles-list/admin-profiles-list.component';
import { AdminRecipesListComponent } from './admin-recipes-list/admin-recipes-list.component';
import { AdminSidebarComponent, AdminView } from './admin-sidebar/admin-sidebar.component';
import { AdminStatsComponent } from './admin-stats/admin-stats.component';

@Component({
  selector: 'app-data-holder',
  imports: [
    RouterModule,
    DataEditerComponent,
    RecipeEditerComponent,
    AdminSidebarComponent,
    AdminStatsComponent,
    AdminProfilesListComponent,
    AdminBookingsListComponent,
    AdminRecipesListComponent,
  ],
  templateUrl: './data-holder.component.html',
  styleUrl: './data-holder.component.scss',
})
export class DataHolderComponent implements OnInit, OnDestroy {
  private subs: Subscription[] = [];

  private adminFacade = inject(AdminFacade);
  private bookingFacade = inject(BookingFacade);
  private recipesFacade = inject(RecipesFacade);

  allUsers = signal<UserProfile[]>([]);
  selectedUser = signal<UserProfile>(undefined);
  selectedRecipe = signal<DocumentFile>(undefined);
  recipeEditorOpen = signal(false);
  searchQuery = signal('');
  activeView = signal<AdminView>('Profiler');

  public bookings: WritableSignal<Booking[]> = signal([]);
  public recipes: WritableSignal<DocumentFile[]> = signal([]);

  filteredUsers = computed(() => {
    const query = this.normalizeForSearch(this.searchQuery());

    if (!query) {
      return this.allUsers();
    }

    return this.allUsers().filter((user) => this.matchesUserFields(user, query));
  });

  filteredBookings = computed(() => {
    const query = this.normalizeForSearch(this.searchQuery());

    if (!query) {
      return this.bookings();
    }

    return this.bookings().filter((booking) => {
      const owner = this.findUserByUid(booking.uid);

      if (owner) {
        return this.matchesUserFields(owner, query);
      }

      const fallbackName = `${booking.firstName || ''} ${booking.lastName || ''}`;
      const fallbackUid = this.normalizeForSearch(booking.uid || '');

      return this.normalizeForSearch(fallbackName).includes(query) || fallbackUid.includes(query);
    });
  });

  filteredRecipes = computed(() => {
    const query = this.normalizeForSearch(this.searchQuery());

    if (!query) {
      return this.recipes();
    }

    return this.recipes().filter((recipe) => {
      const owner = this.findUserByUid(recipe.uid);

      if (!owner) {
        return false;
      }

      return this.matchesUserFields(owner, query);
    });
  });

  hasActiveSearch = computed(() => this.normalizeForSearch(this.searchQuery()).length > 0);

  ngOnInit(): void {
    this.subs.push(
      this.adminFacade.getUsers().subscribe((users) => {
        this.allUsers.set(users);
      }),
    );

    this.subs.push(
      this.bookingFacade.getBookings().subscribe((bookings) => {
        this.bookings.set([...bookings].sort((a, b) => a.date.localeCompare(b.date)));
      }),
    );

    this.subs.push(
      this.recipesFacade.getRecipes().subscribe((recipes) => {
        this.recipes.set([...recipes].sort((a, b) => a.recipe.title.localeCompare(b.recipe.title)));
      }),
    );
  }

  selectUser(uid: string, preserveSelectedRecipe = false) {
    const user = this.allUsers().find((u) => u.uid === uid);
    this.selectedUser.set(user);

    if (!preserveSelectedRecipe) {
      this.selectedRecipe.set(undefined);
      this.recipeEditorOpen.set(false);
    }
  }

  selectRecipe(recipeId: string): void {
    const recipe = this.recipes().find((item) => item.id === recipeId);

    if (!recipe) {
      return;
    }

    this.selectedRecipe.set(recipe);
    this.selectUser(recipe.uid, true);
    this.recipeEditorOpen.set(true);
  }

  isRecipeOnlyMode(): boolean {
    return !!this.selectedRecipe();
  }

  isLibraryRecipeSelected(): boolean {
    const selectedRecipe = this.selectedRecipe();
    return !!selectedRecipe && (!selectedRecipe.uid || selectedRecipe.uid === 'all');
  }

  editer = document.getElementsByClassName('editer');
  openEditer() {
    if (this.selectedRecipe()) {
      this.recipeEditorOpen.set(true);
      return;
    }

    if (this.editer[0].lastChild) {
      let children = this.editer[0].children;
      for (let index = 0; index < children.length; index++) {
        const element = children[index] as Element;
        if (!element.classList.contains('active')) {
          element.classList.add('active');
        }
      }
    }
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value || '');
  }

  selectView(view: AdminView): void {
    this.activeView.set(view);
  }

  closeRecipeEditor(): void {
    this.recipeEditorOpen.set(false);
    this.selectedRecipe.set(undefined);
  }

  handleRecipeDeleted(recipeId: string): void {
    this.recipes.update((recipes) => recipes.filter((recipe) => recipe.id !== recipeId));
    this.recipeEditorOpen.set(false);
    this.selectedRecipe.set(undefined);
  }

  private normalizeForSearch(value: string): string {
    return (value || '').toLowerCase().trim();
  }

  private normalizePhoneForSearch(value: string): string {
    return this.normalizeForSearch(value).replace(/[\s+()-]/g, '');
  }

  private matchesUserFields(user: UserProfile, query: string): boolean {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`;
    const nameNormalized = this.normalizeForSearch(fullName);
    const mailNormalized = this.normalizeForSearch(user.email || '');
    const uidNormalized = this.normalizeForSearch(user.uid || '');
    const phoneNormalized = this.normalizePhoneForSearch(user.phoneNumber || '');
    const queryPhone = this.normalizePhoneForSearch(query);

    return (
      nameNormalized.includes(query) ||
      mailNormalized.includes(query) ||
      uidNormalized.includes(query) ||
      phoneNormalized.includes(queryPhone)
    );
  }

  private findUserByUid(uid: string): UserProfile | undefined {
    return this.allUsers().find((user) => user.uid === uid);
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
