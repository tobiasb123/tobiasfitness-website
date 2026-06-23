import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { UserProfile } from '@models/auth/interfaces';
import { FirebaseService } from '@modules/firebase';

@Component({
  selector: 'app-meal-prep',
  templateUrl: './meal-prep.component.html',
  styleUrl: './meal-prep.component.scss',
})
export class MealPrepComponent implements OnInit {
  private firebaseService = inject(FirebaseService);

  recieverOptions: WritableSignal<UserProfile[]> = signal([]);
  ingriedentList: WritableSignal<string[]> = signal([]);
  progressList: WritableSignal<string[]> = signal([]);

  addMealPageActive = false;

  ngOnInit(): void {
    this.updateUsers();
  }

  updateUsers() {
    this.firebaseService.httpGet<UserProfile[]>('admin-getUsers').then((users) => {
      this.recieverOptions.update(() => {
        return users;
      });
    });
  }

  toggleMealAddPage() {
    this.addMealPageActive = !this.addMealPageActive;
  }

  addItem(item: string, list: string, input: HTMLInputElement) {
    if (item !== '') {
      if (list === 'I-list') {
        this.ingriedentList.update((items) => {
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
      this.ingriedentList.update((items) => items.filter((x) => x !== item));
    }
    if (list === 'P-list') {
      this.progressList.update((items) => items.filter((x) => x !== item));
    }
  }
}
