import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthFunctionsService } from '@modules/auth';
import { Observable } from 'rxjs';
import { RouteExt, routes } from '../../../../app.routes';
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
  private router = inject(Router);

  loggedIn: Observable<boolean> = this.authFunctions.isLoggedIn();
  currentUser = this.authFunctions.currentUserProfile;

  ngOnInit(): void {
    this.routes = routes;
  }

  navList = document.getElementsByClassName('nav');

  openCloseNav() {
    console.log(this.navList.item(0)?.classList);
    if (this.navList.item(0)?.classList.contains('open')) {
      this.navList.item(0)?.classList.remove('open');
    } else {
      this.navList.item(0)?.classList.add('open');
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
    this.accountAccessDiv[0].classList.remove('visible');
    this.authFunctions.logout();
  }

  logIn() {
    this.accountAccessDiv[0].classList.remove('visible');
    this.router.navigate(['signin']);
  }

  signUp() {
    this.accountAccessDiv[0].classList.remove('visible');
    this.router.navigate(['signup']);
  }
}
