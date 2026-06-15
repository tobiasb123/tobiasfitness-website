import { Component } from '@angular/core';

@Component({
  selector: 'app-meal-prep',
  imports: [],
  templateUrl: './meal-prep.component.html',
  styleUrl: './meal-prep.component.scss',
})
export class MealPrepComponent {
  add_meal_page = document.getElementsByClassName('add-meal-page');
  toggle_meal_add_page(event: any) {
    if (this.add_meal_page[0]) {
      if (this.add_meal_page[0].classList.contains('active')) {
        this.add_meal_page[0].classList.remove('active');
        event.target.innerHTML = 'Opret';
        return;
      }
      this.add_meal_page[0].classList.add('active');
      event.target.innerHTML = 'Luk';
    }
  }
}
