import { Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { UserProfile } from '@models/auth/interfaces';
import { DocumentFile, Recipe } from '@models/storage';
import { AuthFunctionsService } from '@modules/auth';
import { FirebaseService } from '@modules/firebase';
import moment from 'moment-timezone';
import { Subscription } from 'rxjs';
import { AdminFacade } from '../admin-menu';
import { ToastService } from '../core/services/toast/toast.service';
import { StorageFunctions } from './services/storage-functions.service';

@Component({
  selector: 'app-meal-prep',
  templateUrl: './meal-prep.component.html',
  styleUrl: './meal-prep.component.scss',
})
export class MealPrepComponent implements OnInit, OnDestroy {
  private subs: Subscription[] = [];

  private authFunctions = inject(AuthFunctionsService);
  private firebaseService = inject(FirebaseService);
  private storageService = inject(StorageFunctions);
  private toast = inject(ToastService);
  private adminFacade = inject(AdminFacade);

  recieverOptions: WritableSignal<UserProfile[]> = signal([]);
  selectedUserUid: WritableSignal<UserProfile> = signal(undefined);
  image: WritableSignal<string> = signal('');
  ingredientList: WritableSignal<string[]> = signal([]);
  progressList: WritableSignal<string[]> = signal([]);
  macroList: WritableSignal<string[]> = signal([]);

  userProfile: UserProfile;

  addMealPageActive = false;

  recipeData: Recipe;

  documentData: DocumentFile;

  ngOnInit(): void {
    this.userProfile = this.authFunctions.currentUserProfile();
    this.subs.push(
      this.adminFacade.getUsers().subscribe((users) => {
        this.recieverOptions.update(() => users);
      }),
    );
  }

  selectUser(event: any) {
    const target = event.target.value;

    if (target !== 'alle') {
      this.selectedUserUid.set(target);
    }
  }

  toggleMealAddPage() {
    this.addMealPageActive = !this.addMealPageActive;
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
        this.progressList.update((items) => {
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
      this.progressList.update((items) => items.filter((x) => x !== item));
    }
  }

  saveMacros(macros: string[]) {
    this.macroList.set(macros);
  }

  save(macros: string[], img: HTMLInputElement) {
    this.saveMacros(macros);

    const timeCreated = moment().toString();
    const file = img.files?.[0] ?? null;
    let newImage = '';

    if (file) {
      newImage = file.name;
      const url = URL.createObjectURL(file);
      this.image.set(url);
    } else {
      newImage = img.value.replace(/^C:\\fakepath\\/, '');
    }

    this.image.set(newImage);

    this.recipeData = {
      image: this.image(),
      ingredients: this.ingredientList(),
      instructions: this.progressList(),
      macros: this.macroList(),
    };

    this.documentData = {
      id: 0,
      fileType: ['slideShowImage'],
      fileName: 'Test',
      filePath: 'fakepath',
      fileUrl: 'fakeurl',
      timeCreated: timeCreated,
      recipe: this.recipeData,
      uid: this.selectedUserUid()?.uid,
    };

    this.storageService
      .saveRecipe(this.documentData)
      .then(() => {
        console.log(this.documentData);
      })
      .catch(() => {
        this.toast.open('Der skete en ukendt fejl. Kunne ikke gemme opskriften', 'error');
      });
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
