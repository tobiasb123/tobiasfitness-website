import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { DocumentFile } from '@models/storage';
import { AuthFunctionsService } from '@modules/auth';
import { StorageFunctions } from '../../meal-prep/services/storage-functions.service';
import { HomeHeroComponent } from './home-hero/home-hero.component';
import { HomeIntroComponent } from './home-intro/home-intro.component';
import { HomeReview, HomeReviewsComponent } from './home-reviews/home-reviews.component';

@Component({
  selector: 'app-home',
  imports: [HomeHeroComponent, HomeIntroComponent, HomeReviewsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  router = inject(Router);
  private authFunctions = inject(AuthFunctionsService);
  private storageFunctions = inject(StorageFunctions);
  userProfile: UserProfile;

  private readonly profileEffect = effect(() => {
    this.userProfile = this.authFunctions.currentUserProfile();
  });

  reviews = signal<HomeReview[]>([]);
  reviewsLoading = signal(true);
  reviewsLoadFailed = signal(false);
  hasReviews = signal(false);

  ngOnInit(): void {
    this.scrollToTop();
    void this.loadReviews();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  createReview() {
    this.navigateTo(this.userProfile ? 'create-review' : 'signin');
  }

  private async loadReviews(): Promise<void> {
    this.reviewsLoading.set(true);

    try {
      const reviewFiles = await this.storageFunctions.getReviews();

      const mappedReviews = reviewFiles
        .filter((reviewFile) => Boolean(reviewFile.review))
        .map((reviewFile) => this.mapReviewFileToHomeReview(reviewFile));

      this.reviews.set(mappedReviews);
      this.reviewsLoadFailed.set(false);
      this.hasReviews.set(mappedReviews.length > 0);
    } catch {
      this.reviews.set([]);
      this.reviewsLoadFailed.set(true);
      this.hasReviews.set(false);
    } finally {
      this.reviewsLoading.set(false);
    }
  }

  private mapReviewFileToHomeReview(reviewFile: DocumentFile): HomeReview {
    const review = reviewFile.review;

    return {
      id: reviewFile.id,
      image: reviewFile.fileUrl,
      review: review?.text || '',
      name: review?.fullName || 'Anonym',
      age: String(review?.age ?? '-'),
      stars: String(review?.rating ?? '-'),
    };
  }
}
