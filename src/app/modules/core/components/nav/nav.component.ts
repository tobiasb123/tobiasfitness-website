import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AUTH_STATE, AuthFunctionsService } from '@modules/auth';
import { RouteExt, routes } from '../../../../app.routes';

import { ToastService } from '../../services/toast/toast.service';

@Component({
  selector: 'app-nav',
  imports: [RouterModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent implements OnInit, OnDestroy {
  routes: RouteExt[] = routes;
  menuOpen = signal(false);
  accountMenuOpen = signal(false);
  navHidden = signal(false);

  private lastScrollY = 0;
  private readonly handleWindowScroll = () => {
    const currentScrollY = window.scrollY;

    if (this.menuOpen()) {
      this.navHidden.set(false);
      this.lastScrollY = currentScrollY;
      return;
    }

    if (currentScrollY > this.lastScrollY && currentScrollY > 0) {
      this.navHidden.set(true);
    } else if (currentScrollY < this.lastScrollY) {
      this.navHidden.set(false);
    }

    this.lastScrollY = currentScrollY;
  };

  private toast = inject(ToastService);
  private authFunctions = inject(AuthFunctionsService);
  private router = inject(Router);
  private authState = inject(AUTH_STATE);

  currentUser = this.authFunctions.currentUserProfile;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.lastScrollY = window.scrollY;
      window.addEventListener('scroll', this.handleWindowScroll, { passive: true });
      this.handleWindowScroll();
    }
  }

  isLoggedIn(): boolean {
    return this.authState() === 'loggedIn';
  }

  shouldShowPrimaryLink(route: RouteExt): boolean {
    if (!route.showInNavList) {
      return false;
    }

    if (route.displayName === 'Konto') {
      return false;
    }

    if (route.displayName === 'Bestil Tid') {
      return true;
    }

    if (route.displayName === 'Opskrifter' || route.displayName === 'Admin-Menu') {
      return !!this.currentUser()?.admin;
    }

    return true;
  }

  isCtaRoute(route: RouteExt): boolean {
    return route.displayName === 'Bestil Tid';
  }

  handlePrimaryNavigation(route: RouteExt): void {
    if (route.displayName === 'Bestil Tid' && !this.isLoggedIn()) {
      this.router.navigate(['signin']);
      this.closeNav();
      return;
    }

    this.closeNav();
  }

  toggleMenu(): void {
    this.menuOpen.update((isOpen) => !isOpen);

    if (this.menuOpen()) {
      this.navHidden.set(false);
    }

    if (!this.menuOpen()) {
      this.accountMenuOpen.set(false);
      this.handleWindowScroll();
    }
  }

  toggleNavVisibility(): void {
    this.menuOpen.set(false);
    this.accountMenuOpen.set(false);
    this.navHidden.update((isHidden) => !isHidden);
  }

  closeNav(): void {
    this.menuOpen.set(false);
    this.accountMenuOpen.set(false);
  }

  toggleAccountMenu(): void {
    this.accountMenuOpen.update((isOpen) => !isOpen);
  }

  logOut(): void {
    this.accountMenuOpen.set(false);
    this.authFunctions.logout();
    this.closeNav();
  }

  logIn(): void {
    this.accountMenuOpen.set(false);
    this.router.navigate(['signin']);
    this.closeNav();
  }

  signUp(): void {
    this.accountMenuOpen.set(false);
    this.router.navigate(['signup']);
    this.closeNav();
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleWindowScroll);
    }
  }
}
