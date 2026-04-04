import { Route, Routes } from '@angular/router';
import { HomeComponent } from './modules/home/pages/home.component';
import { ContactComponent } from './modules/contact/pages/contact.component';
import { PricesComponent } from './modules/prices/pages/prices.component';

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
];
