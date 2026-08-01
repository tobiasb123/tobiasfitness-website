import { Component, computed, input, output, signal } from '@angular/core';
import { DocumentFile } from '@models/storage';

@Component({
  selector: 'app-meal-prep-recipe-card',
  templateUrl: './meal-prep-recipe-card.component.html',
  styleUrl: './meal-prep-recipe-card.component.scss',
})
export class MealPrepRecipeCardComponent {
  recipe = input.required<DocumentFile>();

  selected = output<string>();
  imageLoadFailed = signal(false);
  imageUrl = computed(() => {
    if (this.imageLoadFailed()) {
      return 'upload image.png';
    }

    return (this.recipe().fileUrl || '').trim();
  });

  selectRecipe(): void {
    this.selected.emit(this.recipe().id);
  }

  onImageError(): void {
    this.imageLoadFailed.set(true);
  }
}
