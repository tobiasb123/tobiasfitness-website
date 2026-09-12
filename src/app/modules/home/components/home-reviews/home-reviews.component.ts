import { Component, input, output, signal } from '@angular/core';

export interface HomeReview {
  id: string;
  image: string;
  review: string;
  name: string;
  age: string;
  stars: string;
}

@Component({
  selector: 'app-home-reviews',
  templateUrl: './home-reviews.component.html',
  styleUrl: './home-reviews.component.scss',
})
export class HomeReviewsComponent {
  reviews = input<HomeReview[]>([]);
  loading = input(false);
  loadFailed = input(false);
  hasReviews = input(false);

  createReviewRequested = output<void>();

  expandedReviewId = signal<string | null>(null);
  isDragging = signal(false);

  private dragStartX = 0;
  private scrollStartLeft = 0;
  private suppressCardClick = false;

  createReview(): void {
    this.createReviewRequested.emit();
  }

  handleCardClick(reviewId: string): void {
    if (this.suppressCardClick) {
      this.suppressCardClick = false;
      return;
    }

    this.textReview(reviewId);
  }

  textReview(reviewId: string): void {
    this.expandedReviewId.update((activeReviewId) =>
      activeReviewId === reviewId ? null : reviewId,
    );
  }

  onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select')) {
      return;
    }

    const carousel = event.currentTarget as HTMLElement;
    this.dragStartX = event.clientX;
    this.scrollStartLeft = carousel.scrollLeft;
    this.suppressCardClick = false;
    this.isDragging.set(true);
    carousel.setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.isDragging()) {
      return;
    }

    const carousel = event.currentTarget as HTMLElement;
    const dragDistance = event.clientX - this.dragStartX;

    if (Math.abs(dragDistance) > 4) {
      this.suppressCardClick = true;
    }

    carousel.scrollLeft = this.scrollStartLeft - dragDistance;
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.isDragging()) {
      return;
    }

    const carousel = event.currentTarget as HTMLElement;
    carousel.releasePointerCapture(event.pointerId);
    this.isDragging.set(false);
  }

  isReviewExpanded(reviewId: string): boolean {
    return this.expandedReviewId() === reviewId;
  }
}
