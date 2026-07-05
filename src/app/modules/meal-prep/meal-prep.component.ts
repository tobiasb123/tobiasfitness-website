import { Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UserProfile } from '@models/auth/interfaces';
import { DocumentFile, Recipe } from '@models/storage';
import { AuthFunctionsService } from '@modules/auth';
import moment from 'moment-timezone';
import { Subscription } from 'rxjs';
import { AdminFacade } from '../admin-menu';
import { ToastService } from '../core/services/toast/toast.service';
import { StorageFunctions } from './services/storage-functions.service';

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
  recieverControl = new FormControl<string>('');

  formGroup = new FormGroup({
    title: this.titleControl,
    reciever: this.recieverControl,
  });

  recieverOptions: WritableSignal<UserProfile[]> = signal([]);

  selectedUserUid: WritableSignal<string> = signal('alle');
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

  recipeData: Recipe;

  ngOnInit(): void {
    this.userProfile = this.authFunctions.currentUserProfile();
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
        if (recipe.uid === 'alle') {
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

  openMeal(id: String) {
    const recipe = this.recipies().find((recipe) => recipe.id === id);
    this.selectedDocumentData.set(recipe);
    this.toggleMealviewPage();
  }

  editMeal() {
    this.toggleMealAddPage();
    this.toggleMealviewPage();
    this.editting = true;

    this.ingredientList.set(this.selectedDocumentData().recipe.ingredients);
    this.instructionList.set(this.selectedDocumentData().recipe.instructions);
    this.macroList.set(this.selectedDocumentData().recipe.macros);
  }

  save(macros: string[], img: HTMLInputElement) {
    this.macroList.set(macros);

    const timeCreated = moment().toString();
    const file = img.files?.[0] ?? null;
    let newImage = '';

    this.recipeData = {
      ingredients: this.ingredientList(),
      instructions: this.instructionList(),
      macros: this.macroList(),
    };

    this.storageService
      .saveRecipe(file, this.titleControl.value, this.recipeData)
      .then((documentFile) => {
        if (documentFile.uid === this.userProfile.uid) {
          this.yourRecipies.update((documentFiles) => {
            documentFiles.push(documentFile);
            return documentFiles;
          });
        } else {
          this.recipies.update((documentFiles) => {
            documentFiles.push(documentFile);
            return documentFiles;
          });
        }
        this.toast.open('Opskrift blev oprettet', 'success');
      })
      .catch(() => {
        this.toast.open('Der skete en ukendt fejl. Kunne ikke gemme opskriften', 'error');
      });

    this.addMealPageActive = false;
    this.resetValues();
  }

  edit() {
    this.recipeData = {
      ingredients: this.ingredientList(),
      instructions: this.instructionList(),
      macros: this.macroList(),
    };

    const documentData: DocumentFile = {
      ...this.selectedDocumentData(),
      title: this.titleControl.value,
      recipe: this.recipeData,
    };

    this.storageService
      .editRecipe(documentData)
      .then(() => {
        this.toast.open('Opskrift blev oprettet', 'success');
      })
      .catch(() => {
        this.toast.open('Der skete en ukendt fejl. Kunne ikke gemme opskriften', 'error');
      });
    this.addMealPageActive = false;
    this.resetValues();
  }

  private formatRecipes(recipes: DocumentFile[]): DocumentFile[] {
    return recipes.map((recipe) => ({
      ...recipe,
      timeCreated: moment(recipe.timeCreated).format('DD-MM-YYYY'),
    }));
  }

  resetValues() {
    this.selectedUserUid.set('alle');
    this.title.set('');
    this.image.set('');
    this.ingredientList.set([]);
    this.instructionList.set([]);
    this.macroList.set([]);
    this.selectedDocumentData.set(null);
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
