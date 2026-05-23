import { Route } from '@angular/router';
import { AdminMenuComponent } from './modules/admin-menu/admin-menu.component';
import { ContactComponent } from './modules/contact/pages/contact.component';
import { HomeComponent } from './modules/home/components/home.component';
import { PricesComponent } from './modules/prices/components/prices.component';
import { SigninComponent } from './modules/signin/components/signin.component';
import { SignupComponent } from './modules/signup/components/signup.component';

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
    displayName: 'Bestil Tid',
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
