import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { DocumentFile } from '@models/storage';
import { MealPrepRecipeCardComponent } from '../meal-prep-recipe-card/meal-prep-recipe-card.component';

@Component({
  selector: 'app-meal-prep-carousel',
  imports: [MealPrepRecipeCardComponent],
  templateUrl: './meal-prep-carousel.component.html',
  styleUrl: './meal-prep-carousel.component.scss',
})
export class MealPrepCarouselComponent {
  allRecipes = input<DocumentFile[]>([]);
  personalRecipes = input<DocumentFile[]>([]);
  loading = input(false);
  error = input('');

  recipeSelected = output<string>();

  readonly allCarouselRef = viewChild<ElementRef<HTMLUListElement>>('allCarouselRef');
  readonly personalCarouselRef = viewChild<ElementRef<HTMLUListElement>>('personalCarouselRef');
  activeAllIndex = signal(0);
  activePersonalIndex = signal(0);

  selectRecipe(id: string): void {
    this.recipeSelected.emit(id);
  }

  scrollAll(direction: 'left' | 'right'): void {
    this.scrollCarousel(this.allCarouselRef(), direction);
    this.syncActiveIndex(this.allCarouselRef(), this.activeAllIndex);
  }

  scrollPersonal(direction: 'left' | 'right'): void {
    this.scrollCarousel(this.personalCarouselRef(), direction);
    this.syncActiveIndex(this.personalCarouselRef(), this.activePersonalIndex);
  }

  onAllScroll(): void {
    this.syncActiveIndex(this.allCarouselRef(), this.activeAllIndex);
  }

  onPersonalScroll(): void {
    this.syncActiveIndex(this.personalCarouselRef(), this.activePersonalIndex);
  }

  scrollToAllIndex(index: number): void {
    this.scrollToIndex(this.allCarouselRef(), index);
    this.activeAllIndex.set(index);
  }

  scrollToPersonalIndex(index: number): void {
    this.scrollToIndex(this.personalCarouselRef(), index);
    this.activePersonalIndex.set(index);
  }

  getAllMarkerCount(): number {
    return Math.max(1, this.allRecipes().length);
  }

  getPersonalMarkerCount(): number {
    return Math.max(1, this.personalRecipes().length);
  }

  getAllMarkerIndexes(): number[] {
    return Array.from({ length: this.getAllMarkerCount() }, (_, index) => index);
  }

  getPersonalMarkerIndexes(): number[] {
    return Array.from({ length: this.getPersonalMarkerCount() }, (_, index) => index);
  }

  private scrollCarousel(
    carouselRef: ElementRef<HTMLUListElement> | undefined,
    direction: 'left' | 'right',
  ): void {
    const carousel = carouselRef?.nativeElement;

    if (!carousel) {
      return;
    }

    const scrollAmount = Math.max(280, Math.round(carousel.clientWidth * 0.9));
    const offset = direction === 'right' ? scrollAmount : -scrollAmount;

    carousel.scrollBy({ left: offset, behavior: 'smooth' });
  }

  private scrollToIndex(
    carouselRef: ElementRef<HTMLUListElement> | undefined,
    index: number,
  ): void {
    const carousel = carouselRef?.nativeElement;

    if (!carousel) {
      return;
    }

    const width = carousel.clientWidth;
    carousel.scrollTo({ left: width * index, behavior: 'smooth' });
  }

  private syncActiveIndex(
    carouselRef: ElementRef<HTMLUListElement> | undefined,
    setter: ReturnType<typeof signal<number>>,
  ): void {
    const carousel = carouselRef?.nativeElement;

    if (!carousel || carousel.clientWidth <= 0) {
      return;
    }

    const index = Math.round(carousel.scrollLeft / carousel.clientWidth);
    setter.set(Math.max(0, index));
  }
}
