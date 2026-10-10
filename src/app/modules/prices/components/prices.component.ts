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
import { CreateHotToastRef } from '@ngxpert/hot-toast';
import { UserProfile } from '@models/auth/interfaces';
import { Service } from '@models/booking/interfaces';
import { AUTH_STATE, AuthFunctionsService } from '@modules/auth';
import { ToastService } from '@modules/core';
import { Subscription } from 'rxjs';
import { ServicesFacade, ServiceUpdateState } from '../../contact';
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

  private pendingOperation: {
    serviceId: string;
    successMessage: string;
    toastRef: CreateHotToastRef<unknown>;
  } | null = null;

  adminPanelOpen = signal(false);

  generalServices: WritableSignal<Service[]> = signal([]);
  servicesLoading = signal(false);
  servicesError = signal('');
  serviceUpdateState = signal<ServiceUpdateState>({
    updatingServiceId: null,
    updateError: '',
    updateErrorServiceId: null,
    lastUpdatedServiceId: null,
  });

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

    this.subs.push(
      this.servicesFacade.getServiceUpdateState().subscribe((state) => {
        this.serviceUpdateState.set(state);
        this.handleOperationResult(state);
      }),
    );
  }

  isLoggedIn(): boolean {
    return this.authState() === 'loggedIn';
  }

  toggleAdminPanel(): void {
    this.adminPanelOpen.update((open) => !open);
  }

  updateService(update: { service: Service; imageFile: File | null }): void {
    void this.servicesFacade.updateService(update.service, update.imageFile ?? undefined);
    this.startOperation(update.service.id, 'Gemmer ydelse...', 'Ydelsen blev gemt');
  }

  createService(create: { service: Service; imageFile: File }): void {
    void this.servicesFacade.createService(create.service, create.imageFile);
    this.startOperation(create.service.id, 'Opretter ydelse...', 'Ydelsen blev oprettet');
  }

  deleteService(service: Service): void {
    this.servicesFacade.deleteService(service.id);
    this.startOperation(service.id, 'Sletter ydelse...', 'Ydelsen blev slettet');
  }

  // Started after dispatch so the store has already reset the previous result.
  private startOperation(serviceId: string, loadingMessage: string, successMessage: string): void {
    this.pendingOperation?.toastRef.close({ dismissedByAction: true });
    this.pendingOperation = {
      serviceId,
      successMessage,
      toastRef: this.toast.open(loadingMessage, 'loading'),
    };
  }

  private handleOperationResult(state: ServiceUpdateState): void {
    const operation = this.pendingOperation;
    if (!operation) {
      return;
    }

    if (state.updateErrorServiceId === operation.serviceId) {
      this.toast.update(
        operation.toastRef,
        state.updateError || 'Der skete en fejl. Prøv igen',
        'error',
      );
    } else if (state.lastUpdatedServiceId === operation.serviceId) {
      this.toast.update(operation.toastRef, operation.successMessage, 'success');
    } else {
      return;
    }

    this.pendingOperation = null;
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
