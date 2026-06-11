import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit {
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
}
