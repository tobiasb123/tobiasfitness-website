import { Route, Routes } from '@angular/router';
import { HomeComponent } from './modules/home/pages/home.component';
import { ContactComponent } from './modules/contact/pages/contact.component';

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
    path: 'contact/:step',
    component: ContactComponent,
    displayName: 'Kontakt',
    showInNavList: true,
  },
];
