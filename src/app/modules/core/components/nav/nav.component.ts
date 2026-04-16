import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { RouteExt, routes } from '../../../../app.routes';
import { AuthFunctionsService } from '@modules/auth';
import { Observable, tap } from 'rxjs';
import { UserProfile } from '@models/auth';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-nav',
  imports: [RouterModule, AsyncPipe],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent implements OnInit {
  routes: RouteExt[];

  private authFunctions = inject(AuthFunctionsService);
  private router = inject(Router);

  loggedIn: Observable<boolean> = this.authFunctions.isLoggedIn();
  currentUser = this.authFunctions.currentUser;

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
