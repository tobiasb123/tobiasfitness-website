import { Route, Routes } from '@angular/router';
import { HomeComponent } from './modules/home/pages/home.component';
import { ContactComponent } from './modules/contact/pages/contact.component';
import { PricesComponent } from './modules/prices/pages/prices.component';
import { SignupComponent } from './modules/signup/pages/signup.component';
import { SigninComponent } from './modules/signin/pages/signin.component';
import { AdminMenuComponent } from './modules/admin-menu/admin-menu.component';

export interface RouteExt extends Route {
  displayName?: string;
  showInNavList?: boolean;
}

export const routes: RouteExt[] = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
  },
  {
    path: 'admin-menu',
    component: AdminMenuComponent,
    displayName: 'Admin-Menu',
    showInNavList: true,
  },
  {
    path: 'prices',
    component: PricesComponent,
    displayName: 'Priser',
    showInNavList: true,
  },
  {
    path: 'contact',
    component: ContactComponent,
    displayName: 'Kontakt',
    showInNavList: true,
  },
  {
    path: 'signup',
    component: SignupComponent,
    displayName: 'Konto',
    showInNavList: true,
  },
  {
    path: 'signin',
    component: SigninComponent,
    displayName: 'Konto',
    showInNavList: false,
  },
];
