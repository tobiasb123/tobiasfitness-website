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

  createReview(): void {
    this.createReviewRequested.emit();
  }

  textReview(reviewId: string): void {
    this.expandedReviewId.update((activeReviewId) =>
      activeReviewId === reviewId ? null : reviewId,
    );
  }

  isReviewExpanded(reviewId: string): boolean {
    return this.expandedReviewId() === reviewId;
  }
}
