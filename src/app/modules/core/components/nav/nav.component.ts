import { Component, inject, OnInit } from '@angular/core';
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
export class NavComponent implements OnInit {
  routes: RouteExt[];

  private toast = inject(ToastService);
  private authFunctions = inject(AuthFunctionsService);
  private router = inject(Router);
  private authState = inject(AUTH_STATE);

  currentUser = this.authFunctions.currentUserProfile;

  ngOnInit(): void {
    this.routes = routes;
  }

  navList = document.getElementsByClassName('nav');
  screenClearDiv = document.getElementsByClassName('screen-clear');

  isLoggedIn(): boolean {
    return this.authState() === 'loggedIn';
  }

  openCloseNav() {
    if (this.navList.item(0)?.classList.contains('open')) {
      this.navList.item(0)?.classList.remove('open');
      this.screenClearDiv[0].classList.remove('open');
      this.accountAccessDiv[0].classList.remove('visible');
    } else {
      this.navList.item(0)?.classList.add('open');
      this.screenClearDiv[0].classList.add('open');
    }
  }

  closeNav() {
    if (this.navList.item(0)?.classList.contains('open')) {
      this.navList.item(0)?.classList.remove('open');
      this.screenClearDiv[0].classList.remove('open');
      this.accountAccessDiv[0].classList.remove('visible');
    }
  }

  accountAccessDiv = document.getElementsByClassName('account-access');
  accountAccess() {
    if (this.accountAccessDiv[0].classList.contains('visible')) {
      this.accountAccessDiv[0].classList.remove('visible');
    } else {
      this.accountAccessDiv[0].classList.add('visible');
    }
  }

  logOut() {
    this.accountAccess();
    this.authFunctions.logout();
    this.closeNav();
  }

  logIn() {
    this.accountAccess();
    this.router.navigate(['signin']);
    this.closeNav();
  }

  signUp() {
    this.accountAccess();
    this.router.navigate(['signup']);
    this.closeNav();
  }
}
