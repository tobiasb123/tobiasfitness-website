import {
  Component,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { Service } from '@models/booking/interfaces';
import { AUTH_STATE, AuthFunctionsService } from '@modules/auth';
import { ToastService } from '@modules/core';
import { Subscription } from 'rxjs';
import { ServicesFacade } from '../../contact';
import { PricesAdminPanelComponent } from './prices-admin-panel/prices-admin-panel.component';
import { PricesServicesListComponent } from './prices-services-list/prices-services-list.component';

@Component({
  selector: 'app-prices',
  imports: [RouterModule, PricesAdminPanelComponent, PricesServicesListComponent],
  templateUrl: './prices.component.html',
  styleUrl: './prices.component.scss',
})
export class PricesComponent implements OnInit, OnDestroy {
  private subs: Subscription[] = [];
  authFunctions = inject(AuthFunctionsService);
  router = inject(Router);
  authState = inject(AUTH_STATE);
  toast = inject(ToastService);
  servicesFacade = inject(ServicesFacade);

  adminPanelOpen = signal(false);

  generalServices: WritableSignal<Service[]> = signal([]);
  servicesLoading = signal(false);
  servicesError = signal('');

  userProfile: UserProfile;

  private readonly profileEffect = effect(() => {
    this.userProfile = this.authFunctions.currentUserProfile();
  });

  async ngOnInit(): Promise<void> {
    this.subs.push(
      this.servicesFacade.getServices().subscribe((services) => {
        this.generalServices.set(services);
      }),
    );

    this.subs.push(
      this.servicesFacade.isLoadingServices().subscribe((loading) => {
        this.servicesLoading.set(loading);
      }),
    );

    this.subs.push(
      this.servicesFacade.getLoadingServicesError().subscribe((error) => {
        this.servicesError.set(error || '');
      }),
    );
  }

  isLoggedIn(): boolean {
    return this.authState() === 'loggedIn';
  }

  toggleAdminPanel(): void {
    this.adminPanelOpen.update((open) => !open);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    if (route === 'signin') {
      this.toast.open('Du skal logge ind først', 'info');
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
