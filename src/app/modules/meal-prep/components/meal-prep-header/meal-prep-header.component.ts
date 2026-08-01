import { Component, input } from '@angular/core';

@Component({
  selector: 'app-meal-prep-header',
  templateUrl: './meal-prep-header.component.html',
  styleUrl: './meal-prep-header.component.scss',
})
export class MealPrepHeaderComponent {
  isAdmin = input(false);
}
