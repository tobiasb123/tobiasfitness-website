import { inject, Injectable } from '@angular/core';
import { Service } from '@models/booking/interfaces';
import { Store } from '@ngrx/store';
import { filter, Observable, switchMap, tap } from 'rxjs';
import { loadServicesAction } from './services.actions';
import {
  selectLoadingServices,
  selectLoadingServicesError,
  selectServices,
  selectServicesFeature,
} from './services.selectors';

@Injectable({ providedIn: 'root' })
export class ServicesFacade {
  private store = inject(Store);

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
}
