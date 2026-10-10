import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { DocumentFile } from '@models/storage';
import { AUTH_STATE } from '@modules/auth';
import { HomeHeroAdminComponent } from '../home-hero-admin/home-hero-admin.component';

const ROTATION_INTERVAL_MS = 5000;
const FALLBACK_IMAGE = 'Forbillede.jpeg';

@Component({
  selector: 'app-home-hero',
  imports: [NgOptimizedImage, HomeHeroAdminComponent],
  templateUrl: './home-hero.component.html',
  styleUrl: './home-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHeroComponent {
  private readonly router = inject(Router);
  private readonly authState = inject(AUTH_STATE);
  private readonly prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  readonly images = input<DocumentFile[]>([]);
  readonly loading = input(false);
  readonly isAdmin = input(false);
  readonly imagesChanged = output<void>();

  readonly userPaused = signal(false);
  private readonly currentIndex = signal(0);
  private readonly interacting = signal(false);

  readonly slides = computed(() => {
    if (this.loading()) {
      return [];
    }

    const urls = this.images().map((image) => image.fileUrl);
    return urls.length > 0 ? urls : [FALLBACK_IMAGE];
  });
  readonly activeIndex = computed(() => this.currentIndex() % Math.max(this.slides().length, 1));
  private readonly rotating = computed(
    () =>
      this.slides().length > 1 &&
      !this.prefersReducedMotion &&
      !this.userPaused() &&
      !this.interacting(),
  );

  private readonly rotationEffect = effect((onCleanup) => {
    this.currentIndex();

    if (!this.rotating()) {
      return;
    }

    const count = this.slides().length;
    const timer = setTimeout(
      () => this.currentIndex.set((this.activeIndex() + 1) % count),
      ROTATION_INTERVAL_MS,
    );
    onCleanup(() => clearTimeout(timer));
  });

  goToSlide(index: number): void {
    this.currentIndex.set(index);
  }

  togglePause(): void {
    this.userPaused.update((paused) => !paused);
  }

  setInteracting(interacting: boolean): void {
    this.interacting.set(interacting);
  }

  goToLink(url: string): void {
    window.open(url, '_blank');
  }

  bookAppointment(): void {
    this.router.navigate([this.authState() === 'loggedIn' ? 'contact' : 'signin']);
  }
}
