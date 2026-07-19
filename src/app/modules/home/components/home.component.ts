import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { AuthFunctionsService } from '@modules/auth';

@Component({
  selector: 'app-home',
  imports: [RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit {
  router = inject(Router);
  private authFunctions = inject(AuthFunctionsService);
  userProfile: UserProfile;

  private readonly profileEffect = effect(() => {
    this.userProfile = this.authFunctions.currentUserProfile();
  });

  reviewText: boolean = false;

  reviews = [
    {
      image: '/Sandie%20Tolstrup.jpeg',
      review:
        'En rigtig god oplevelse med en meget grundig vejledning fra Tobias. Inden vi gik i gang, stillede han gode og relevante spørgsmål, så træningen og programmet kunne tilpasses mig og mine behov. Jeg fik en grundig vejledning i brugen af maskinerne, så jeg følte mig tryg ved øvelserne. Og så var det dejligt med lidt ros og opmuntring undervejs 😊 Kan klart anbefales!',
      name: 'Sandie Tolstrup',
      age: '45',
      stars: '5',
    },
  ];

  @ViewChildren('infoBox', { read: ElementRef }) infoBoxes!: QueryList<ElementRef<HTMLElement>>;

  ngOnInit(): void {
    this.scrollToTop();
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

  textReview() {
    this.reviewText = !this.reviewText;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  createReview() {
    this.navigateTo('create-review');
  }
}
