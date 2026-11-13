import { Route } from '@angular/router';

export interface RouteExt extends Route {
  displayName?: string;
  showInNavList?: boolean;
}

export const routes: RouteExt[] = [
  {
    path: '',
    loadComponent: () =>
      import('./modules/home/components/home.component').then((m) => m.HomeComponent),
    pathMatch: 'full',
  },
  {
    path: 'admin-menu',
    loadComponent: () =>
      import('./modules/admin-menu/admin-menu.component').then((m) => m.AdminMenuComponent),
    displayName: 'Admin-Menu',
    showInNavList: true,
  },
  {
    path: 'meal-prep',
    loadComponent: () =>
      import('./modules/meal-prep/meal-prep.component').then((m) => m.MealPrepComponent),
    displayName: 'Opskrifter',
    showInNavList: true,
  },
  {
    path: 'training-program',
    loadComponent: () =>
      import('./modules/training-program/training-program.component').then(
        (m) => m.TrainingProgramComponent,
      ),
    displayName: 'Træningsprogram',
    showInNavList: true,
  },
  {
    path: 'prices',
    loadComponent: () =>
      import('./modules/prices/components/prices.component').then((m) => m.PricesComponent),
    displayName: 'Priser',
    showInNavList: true,
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./modules/contact/components/contact.component').then((m) => m.ContactComponent),
    displayName: 'Bestil Tid',
    showInNavList: true,
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./modules/signup/components/signup.component').then((m) => m.SignupComponent),
    displayName: 'Konto',
    showInNavList: true,
  },
  {
    path: 'signin',
    loadComponent: () =>
      import('./modules/signin/components/signin.component').then((m) => m.SigninComponent),
    displayName: 'Konto',
    showInNavList: false,
  },
  {
    path: 'account-management',
    loadComponent: () =>
      import('./modules/account-management/account-management.component').then(
        (m) => m.AccountManagementComponent,
      ),
    displayName: 'account-management',
    showInNavList: false,
  },
  {
    path: 'create-review',
    loadComponent: () =>
      import('./modules/create-review/create-review.component').then(
        (m) => m.CreateReviewComponent,
      ),
    displayName: 'create-review',
    showInNavList: false,
  },
];
