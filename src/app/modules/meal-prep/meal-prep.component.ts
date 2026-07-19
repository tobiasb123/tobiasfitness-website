import { Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UserProfile } from '@models/auth/interfaces';
import { DocumentFile, Recipe } from '@models/storage';
import { AuthFunctionsService } from '@modules/auth';
import { FirebaseError } from 'firebase/app';
import { UploadTaskSnapshot } from 'firebase/storage';
import moment from 'moment-timezone';
import { Subscription } from 'rxjs';
import { AdminFacade } from '../admin-menu';
import { ToastService } from '../core/services/toast/toast.service';
import { ResumableRecipeUpload, StorageFunctions } from './services/storage-functions.service';

@Component({
  selector: 'app-meal-prep',
  imports: [ReactiveFormsModule],
  templateUrl: './meal-prep.component.html',
  styleUrl: './meal-prep.component.scss',
})
export class MealPrepComponent implements OnInit, OnDestroy {
  private subs: Subscription[] = [];

  private authFunctions = inject(AuthFunctionsService);
  private storageService = inject(StorageFunctions);
  private toast = inject(ToastService);
  private adminFacade = inject(AdminFacade);

  titleControl = new FormControl<string>('');
  recieverControl = new FormControl<string>('all');

  formGroup = new FormGroup({
    title: this.titleControl,
    reciever: this.recieverControl,
  });

  recieverOptions: WritableSignal<UserProfile[]> = signal([]);

  selectedUserUid: WritableSignal<string> = signal('all');
  title: WritableSignal<string> = signal('');
  image: WritableSignal<string> = signal('');
  ingredientList: WritableSignal<string[]> = signal([]);
  instructionList: WritableSignal<string[]> = signal([]);
  macroList: WritableSignal<string[]> = signal(['', '', '', '']);

  selectedDocumentData: WritableSignal<DocumentFile> = signal(undefined);

  recipies: WritableSignal<DocumentFile[]> = signal([]);
  yourRecipies: WritableSignal<DocumentFile[]> = signal([]);

  userProfile: UserProfile;

  addMealPageActive = false;
  viewMealPageActive = false;

  editting = false;
  isUploading = signal(false);
  uploadProgress = signal(0);
  uploadEtaSeconds = signal<number | null>(null);

  recipeData: Recipe;
  private activeUpload: ResumableRecipeUpload | null = null;
  private uploadStartedAtMs: number | null = null;

  ngOnInit(): void {
    this.userProfile = this.authFunctions.currentUserProfile();
    this.subs.push(
      this.recieverControl.valueChanges.subscribe((selectedUid) => {
        this.selectedUserUid.set(selectedUid || 'all');
      }),
    );

    this.recieverControl.setValue('all', { emitEvent: false });
    this.selectedUserUid.set('all');

    this.subs.push(
      this.adminFacade.getUsers().subscribe((users) => {
        this.recieverOptions.update(() => users);
      }),
    );

    this.storageService.getRecipies().then((recipies) => {
      var allRecipies: Array<DocumentFile> = [];
      var userRecipies: Array<DocumentFile> = [];
      for (let index = 0; index < recipies.length; index++) {
        const recipe = recipies[index];
        if (recipe.uid === 'all') {
          allRecipies.push(recipe);
        }
        if (recipe.uid === this.userProfile.uid) {
          userRecipies.push(recipe);
        }
      }
      this.recipies.set(this.formatRecipes(allRecipies));
      this.yourRecipies.set(this.formatRecipes(userRecipies));
    });
  }

  toggleMealAddPage() {
    this.addMealPageActive = !this.addMealPageActive;
  }

  toggleMealviewPage() {
    this.viewMealPageActive = !this.viewMealPageActive;
  }

  addItem(item: string, list: string, input: HTMLInputElement) {
    if (item !== '') {
      if (list === 'I-list') {
        this.ingredientList.update((items) => {
          input.value = '';
          return [...items, item];
        });
      }

      if (list === 'P-list') {
        this.instructionList.update((items) => {
          input.value = '';
          return [...items, item];
        });
      }
    }
  }

  removeItem(item: string, list: string) {
    if (list === 'I-list') {
      this.ingredientList.update((items) => items.filter((x) => x !== item));
    }
    if (list === 'P-list') {
      this.instructionList.update((items) => items.filter((x) => x !== item));
    }
  }

  openMeal(id: string) {
    const recipe = [...this.recipies(), ...this.yourRecipies()].find(
      (recipeItem) => recipeItem.id === id,
    );
    this.selectedDocumentData.set(recipe);
    this.toggleMealviewPage();
  }

  editMeal() {
    this.toggleMealAddPage();
    this.toggleMealviewPage();
    this.editting = true;
    const selectedDocument = this.selectedDocumentData();

    this.titleControl.setValue(selectedDocument.title);
    this.recieverControl.setValue(selectedDocument.uid || 'all', { emitEvent: false });
    this.selectedUserUid.set(selectedDocument.uid || 'all');

    this.ingredientList.set(selectedDocument.recipe.ingredients);
    this.instructionList.set(selectedDocument.recipe.instructions);
    this.macroList.set(selectedDocument.recipe.macros);
  }

  async submitRecipe(macros: string[], img: HTMLInputElement): Promise<void> {
    if (this.isUploading()) {
      return;
    }

    this.macroList.set(macros);
    const file = img.files?.[0] ?? null;

    this.recipeData = {
      ingredients: this.ingredientList(),
      instructions: this.instructionList(),
      macros: this.macroList(),
    };

    try {
      if (this.editting) {
        await this.updateRecipe(file);
        this.toast.open('Opskrift blev opdateret', 'success');
      } else {
        if (!file) {
          throw new Error('Vælg et billede til opskriften');
        }

        this.startUpload();
        this.activeUpload = this.storageService.startSaveRecipeUpload(
          file,
          this.titleControl.value ?? '',
          this.recipeData,
          this.selectedUserUid(),
          (snapshot) => this.handleUploadProgress(snapshot),
        );

        const documentFile = await this.activeUpload.promise;
        this.finishUpload();

        this.upsertRecipe(documentFile);
        this.toast.open('Opskrift blev oprettet', 'success');
      }

      img.value = '';
      this.addMealPageActive = false;
      this.resetValues();
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

  resetValues() {
    this.cancelUpload(false);
    this.selectedUserUid.set('all');
    this.title.set('');
    this.image.set('');
    this.ingredientList.set([]);
    this.instructionList.set([]);
    this.titleControl.reset('');
    this.recieverControl.reset('all');
    this.macroList.set(['', '', '', '']);
    this.editting = false;
    this.selectedDocumentData.set(null);
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

  private async updateRecipe(file: File | null): Promise<void> {
    const selectedDocument = this.selectedDocumentData();

    if (!selectedDocument) {
      throw new Error('Opskrift blev ikke fundet');
    }

    const title = this.titleControl.value ?? '';

    if (file) {
      this.startUpload();
      this.activeUpload = this.storageService.startReplaceRecipeFileUpload(
        file,
        selectedDocument.id,
        title,
        this.recipeData,
        this.selectedUserUid(),
        (snapshot) => this.handleUploadProgress(snapshot),
      );

      const updatedDocument = await this.activeUpload.promise;
      this.finishUpload();

      this.upsertRecipe(updatedDocument);
      return;
    }

    const updatedDocument: DocumentFile = {
      ...selectedDocument,
      uid: this.selectedUserUid(),
      title,
      recipe: this.recipeData,
    };

    await this.storageService.editRecipe(updatedDocument);

    this.upsertRecipe(updatedDocument);
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

    this.recipies.update((recipes) => this.updateRecipeCollection(recipes, formattedRecipe, false));
    this.yourRecipies.update((recipes) =>
      this.updateRecipeCollection(recipes, formattedRecipe, true),
    );
    this.selectedDocumentData.set(formattedRecipe);
  }

  private updateRecipeCollection(
    recipes: DocumentFile[],
    recipe: DocumentFile,
    isUserCollection: boolean,
  ): DocumentFile[] {
    const withoutRecipe = recipes.filter((existingRecipe) => existingRecipe.id !== recipe.id);

    if (!this.belongsToCollection(recipe, isUserCollection)) {
      return withoutRecipe;
    }

    return [...withoutRecipe, recipe];
  }

  private belongsToCollection(recipe: DocumentFile, isUserCollection: boolean): boolean {
    if (isUserCollection) {
      return recipe.uid === this.userProfile.uid;
    }

    return recipe.uid === 'all';
  }

  ngOnDestroy(): void {
    this.cancelUpload(false);
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
