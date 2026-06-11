import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthFunctionsService } from '@modules/auth';
import { Observable } from 'rxjs';
import { RouteExt, routes } from '../../../../app.routes';
import { PassStateService } from '../../services/pass-state/pass-state.service';
import { ToastService } from '../../services/toast/toast.service';

@Component({
  selector: 'app-nav',
  imports: [RouterModule, AsyncPipe],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent implements OnInit {
  routes: RouteExt[];

  private toast = inject(ToastService);

  private authFunctions = inject(AuthFunctionsService);
  private passStateService = inject(PassStateService);
  private router = inject(Router);

  loggedIn: Observable<boolean> = this.authFunctions.isLoggedIn();
  currentUser = this.authFunctions.currentUserProfile;

  setPassState(value: boolean): void {
    this.passStateService.setUsingPass(value);
    console.log(this.passStateService.usingPass$);
  }

  ngOnInit(): void {
    this.routes = routes;
  }

  navList = document.getElementsByClassName('nav');
  screenClearDiv = document.getElementsByClassName('screen-clear');

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
    this.toast.open('Du blev logget ud', 'warning');
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
