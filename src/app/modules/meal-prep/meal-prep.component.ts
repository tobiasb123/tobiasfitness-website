import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { UserProfile } from '@models/auth/interfaces';
import { DocumentFile } from '@models/storage';
import { AuthFunctionsService } from '@modules/auth';
import { FirebaseError } from 'firebase/app';
import { UploadTaskSnapshot } from 'firebase/storage';
import moment from 'moment-timezone';
import { Subscription } from 'rxjs';
import { AdminFacade } from '../admin-menu';
import { ToastService } from '../core/services/toast/toast.service';
import { MealPrepCarouselComponent } from './components/meal-prep-carousel/meal-prep-carousel.component';
import {
  MealPrepCreateComponent,
  MealPrepCreatePayload,
} from './components/meal-prep-create/meal-prep-create.component';
import { MealPrepHeaderComponent } from './components/meal-prep-header/meal-prep-header.component';
import { MealPrepViewComponent } from './components/meal-prep-view/meal-prep-view.component';
import { ResumableUpload, StorageFunctions } from './services/storage-functions.service';
import { RecipesFacade } from './store/recipes.facade';

@Component({
  selector: 'app-meal-prep',
  imports: [
    MealPrepHeaderComponent,
    MealPrepCreateComponent,
    MealPrepViewComponent,
    MealPrepCarouselComponent,
  ],
  templateUrl: './meal-prep.component.html',
  styleUrl: './meal-prep.component.scss',
})
export class MealPrepComponent implements OnInit, OnDestroy {
  private subs: Subscription[] = [];

  private authFunctions = inject(AuthFunctionsService);
  private storageService = inject(StorageFunctions);
  private toast = inject(ToastService);
  private adminFacade = inject(AdminFacade);
  private recipesFacade = inject(RecipesFacade);

  recieverOptions: WritableSignal<UserProfile[]> = signal([]);

  selectedDocumentData: WritableSignal<DocumentFile | null> = signal(null);

  recipies: WritableSignal<DocumentFile[]> = signal([]);
  yourRecipies: WritableSignal<DocumentFile[]> = signal([]);
  allRecipes: WritableSignal<DocumentFile[]> = signal([]);
  recipesLoading = signal(false);
  recipesError = signal('');
  createResetVersion = signal(0);

  userProfile = signal<UserProfile | undefined>(undefined);
  isAdmin = computed(() => Boolean(this.userProfile()?.admin));
  viewMealPageActive = false;

  isUploading = signal(false);
  uploadProgress = signal(0);
  uploadEtaSeconds = signal<number | null>(null);

  private activeUpload: ResumableUpload | null = null;
  private uploadStartedAtMs: number | null = null;

  private readonly profileEffect = effect(() => {
    const profile = this.authFunctions.currentUserProfile();
    this.userProfile.set(profile);
    this.setRecipeCollections(this.allRecipes());
  });

  ngOnInit(): void {
    this.subs.push(
      this.adminFacade.getUsers().subscribe((users) => {
        this.recieverOptions.update(() => users);
      }),
    );

    this.subs.push(
      this.recipesFacade.getRecipes().subscribe((recipes) => {
        this.allRecipes.set(recipes);
        this.setRecipeCollections(recipes);
      }),
    );

    this.subs.push(
      this.recipesFacade.isLoadingRecipes().subscribe((loading) => {
        this.recipesLoading.set(loading);
      }),
    );

    this.subs.push(
      this.recipesFacade.getLoadingRecipesError().subscribe((error) => {
        this.recipesError.set(error || '');
      }),
    );
  }

  openMeal(id: string) {
    const recipe = [...this.recipies(), ...this.yourRecipies()].find(
      (recipeItem) => recipeItem.id === id,
    );

    if (!recipe) {
      return;
    }

    this.selectedDocumentData.set(recipe);
    this.viewMealPageActive = true;
  }

  closeMealView(): void {
    this.viewMealPageActive = false;
    this.selectedDocumentData.set(null);
  }

  async submitRecipe(payload: MealPrepCreatePayload): Promise<void> {
    if (this.isUploading()) {
      return;
    }

    try {
      this.startUpload();
      this.activeUpload = this.storageService.saveRecipe(
        payload.file,
        payload.recipe,
        payload.receiverUid,
        (snapshot) => this.handleUploadProgress(snapshot),
      );

      const documentFile = await this.activeUpload.promise;
      this.finishUpload();

      this.upsertRecipe(documentFile);
      this.createResetVersion.update((version) => version + 1);
      this.toast.open('Opskrift blev oprettet', 'success');
    } catch (error) {
      this.finishUpload();
      const message = error instanceof FirebaseError || error instanceof Error ? error.message : '';

      if (error instanceof FirebaseError && error.code === 'storage/canceled') {
        this.toast.open('Upload blev annulleret', 'success');
        return;
      }

      this.toast.open(message || 'Der skete en ukendt fejl. Kunne ikke gemme opskriften', 'error');
    }
  }

  private formatRecipes(recipes: DocumentFile[]): DocumentFile[] {
    return recipes.map((recipe) => ({
      ...recipe,
      timeCreated: moment(recipe.timeCreated).format('DD-MM-YYYY'),
    }));
  }

  cancelUpload(showToast = true): void {
    if (!this.activeUpload) {
      return;
    }

    this.activeUpload.cancel();

    if (showToast) {
      this.toast.open('Annullerer upload...', 'success');
    }
  }

  private startUpload(): void {
    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.uploadEtaSeconds.set(null);
    this.uploadStartedAtMs = Date.now();
  }

  private finishUpload(): void {
    this.activeUpload = null;
    this.isUploading.set(false);
    this.uploadProgress.set(0);
    this.uploadEtaSeconds.set(null);
    this.uploadStartedAtMs = null;
  }

  getUploadEtaLabel(): string {
    const etaSeconds = this.uploadEtaSeconds();

    if (etaSeconds === null) {
      return 'Beregner tid...';
    }

    if (etaSeconds < 60) {
      return `${etaSeconds}s tilbage`;
    }

    const minutes = Math.floor(etaSeconds / 60);
    const seconds = etaSeconds % 60;
    return `${minutes}m ${seconds}s tilbage`;
  }

  private handleUploadProgress(snapshot: UploadTaskSnapshot): void {
    const totalBytes = snapshot.totalBytes;

    if (!totalBytes) {
      this.uploadProgress.set(0);
      this.uploadEtaSeconds.set(null);
      return;
    }

    const progress = Math.floor((snapshot.bytesTransferred / totalBytes) * 100);
    this.uploadProgress.set(progress);

    if (!this.uploadStartedAtMs || snapshot.bytesTransferred <= 0) {
      this.uploadEtaSeconds.set(null);
      return;
    }

    const elapsedSeconds = (Date.now() - this.uploadStartedAtMs) / 1000;

    if (elapsedSeconds <= 0) {
      this.uploadEtaSeconds.set(null);
      return;
    }

    const bytesPerSecond = snapshot.bytesTransferred / elapsedSeconds;

    if (bytesPerSecond <= 0) {
      this.uploadEtaSeconds.set(null);
      return;
    }

    const remainingBytes = totalBytes - snapshot.bytesTransferred;
    const etaSeconds = Math.max(0, Math.ceil(remainingBytes / bytesPerSecond));

    this.uploadEtaSeconds.set(etaSeconds);
  }

  private upsertRecipe(documentFile: DocumentFile): void {
    const formattedRecipe = this.formatRecipes([documentFile])[0];

    this.recipesFacade.upsertRecipe(formattedRecipe);
    this.selectedDocumentData.set(formattedRecipe);
  }

  private setRecipeCollections(recipes: DocumentFile[]): void {
    const allRecipies = recipes.filter((recipe) => recipe.uid === 'all');
    const userUid = this.userProfile()?.uid;
    const userRecipies = userUid ? recipes.filter((recipe) => recipe.uid === userUid) : [];

    this.recipies.set(this.formatRecipes(allRecipies));
    this.yourRecipies.set(this.formatRecipes(userRecipies));
  }

  ngOnDestroy(): void {
    this.cancelUpload(false);
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
