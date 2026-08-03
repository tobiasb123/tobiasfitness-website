import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnInit,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { DocumentFile } from '@models/storage';
import { AuthFunctionsService } from '@modules/auth';
import { StorageFunctions } from '../../meal-prep/services/storage-functions.service';

interface HomeReview {
  id: string;
  image: string;
  review: string;
  name: string;
  age: string;
  stars: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit {
  router = inject(Router);
  private authFunctions = inject(AuthFunctionsService);
  private storageFunctions = inject(StorageFunctions);
  userProfile: UserProfile;

  private readonly profileEffect = effect(() => {
    this.userProfile = this.authFunctions.currentUserProfile();
  });

  expandedReviewId = signal<string | null>(null);

  reviews = signal<HomeReview[]>([]);
  reviewsLoading = signal(true);
  reviewsLoadFailed = signal(false);
  hasReviews = computed(() => this.reviews().length > 0);

  @ViewChildren('infoBox', { read: ElementRef }) infoBoxes!: QueryList<ElementRef<HTMLElement>>;

  ngOnInit(): void {
    this.scrollToTop();
    void this.loadReviews();
  }

  ngAfterViewInit(): void {
    const handleScroll = () => {
      this.infoBoxes.forEach((box) => {
        const element = box.nativeElement;
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        let opacity = 0;
        const fadeDuration = viewportHeight * 0.5; // Use half viewport height as consistent fade distance

        if (rect.top >= viewportHeight) {
          // Element is below viewport
          opacity = 0;
        } else if (rect.bottom <= 0) {
          // Element is above viewport
          opacity = 0;
        } else if (rect.bottom > 0 && rect.top < 0) {
          // Element is entering from top: fade in as it enters
          opacity = rect.bottom / fadeDuration;
        } else if (rect.top >= 0 && rect.bottom <= viewportHeight) {
          // Element is fully visible
          opacity = 1;
        } else if (rect.top < viewportHeight && rect.bottom > viewportHeight) {
          // Element is leaving bottom: fade out
          opacity = (viewportHeight - rect.top) / fadeDuration;
        }

        const finalOpacity = Math.max(0.25, Math.min(1, opacity));
        element.style.opacity = finalOpacity.toString();
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Call once on init
  }

  goToLink(url: string) {
    window.open(url, '_blank');
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  textReview(reviewId: string): void {
    this.expandedReviewId.update((activeReviewId) =>
      activeReviewId === reviewId ? null : reviewId,
    );
  }

  isReviewExpanded(reviewId: string): boolean {
    return this.expandedReviewId() === reviewId;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  createReview() {
    this.navigateTo('create-review');
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
    } catch {
      this.reviews.set([]);
      this.reviewsLoadFailed.set(true);
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
