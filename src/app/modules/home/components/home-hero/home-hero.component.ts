import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AUTH_STATE } from '@modules/auth';

@Component({
  selector: 'app-home-hero',
  templateUrl: './home-hero.component.html',
  styleUrl: './home-hero.component.scss',
})
export class HomeHeroComponent {
  private readonly router = inject(Router);
  private readonly authState = inject(AUTH_STATE);

  goToLink(url: string): void {
    window.open(url, '_blank');
  }

  bookAppointment(): void {
    this.router.navigate([this.authState() === 'loggedIn' ? 'contact' : 'signin']);
  }
}
