import { inject, Injectable } from '@angular/core';
import { Service } from '@models/booking/interfaces';
import { Store } from '@ngrx/store';
import { filter, Observable, switchMap, tap } from 'rxjs';
import { StorageFunctions } from '../../meal-prep/services/storage-functions.service';
import {
  createServiceAction,
  deleteServiceAction,
  loadServicesAction,
  updateServiceAction,
  updateServiceFailAction,
  updateServiceStartedAction,
} from './services.actions';
import {
  selectLoadingServices,
  selectLoadingServicesError,
  selectServices,
  selectServicesFeature,
  selectServiceUpdateState,
} from './services.selectors';

@Injectable({ providedIn: 'root' })
export class ServicesFacade {
  private store = inject(Store);
  private storageFunctions = inject(StorageFunctions);

  public getServices(): Observable<Service[]> {
    return this.store.select(selectServicesFeature).pipe(
      tap((state) => {
        if (!state.loaded && !state.loading) {
          this.store.dispatch(loadServicesAction());
        }
      }),
      filter((state) => state.loaded),
      switchMap(() => this.store.select(selectServices)),
    );
  }

  public isLoadingServices(): Observable<boolean> {
    return this.store.select(selectLoadingServices);
  }

  public getLoadingServicesError(): Observable<string> {
    return this.store.select(selectLoadingServicesError);
  }

  public getServiceUpdateState() {
    return this.store.select(selectServiceUpdateState);
  }

  public async createService(service: Service, imageFile: File): Promise<void> {
    await this.saveService(service, imageFile, createServiceAction);
  }

  public async updateService(service: Service, imageFile?: File): Promise<void> {
    await this.saveService(service, imageFile, updateServiceAction);
  }

  public deleteService(serviceId: string): void {
    this.store.dispatch(deleteServiceAction({ serviceId }));
  }

  private async saveService(
    service: Service,
    imageFile: File | undefined,
    action: typeof updateServiceAction | typeof createServiceAction,
  ): Promise<void> {
    this.store.dispatch(updateServiceStartedAction({ serviceId: service.id }));

    try {
      const uploadedImage = imageFile
        ? await this.storageFunctions.uploadServiceImage(imageFile, service.id).promise
        : null;

      this.store.dispatch(
        action({
          service: uploadedImage ? { ...service, image: uploadedImage.fileUrl } : service,
        }),
      );
    } catch (error: unknown) {
      this.store.dispatch(
        updateServiceFailAction({
          serviceId: service.id,
          error: error instanceof Error ? error.message : 'Billedet kunne ikke uploades.',
        }),
      );
    }
  }
}
