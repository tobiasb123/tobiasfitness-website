import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Service } from '@models/booking/interfaces';
import { AUTH_STATE, AuthFunctionsService } from '@modules/auth';
import { BehaviorSubject, of } from 'rxjs';
import { vi } from 'vitest';
import { ServicesFacade } from '../../contact';
import { ServiceUpdateState } from '../../contact/store/services.selectors';
import { ToastService } from '../../core/services/toast/toast.service';
import { PricesComponent } from './prices.component';

describe('PricesComponent operation feedback', () => {
  it('reports upload progress and clears it when saving completes', () => {
    const state = new BehaviorSubject<ServiceUpdateState>({
      updatingServiceId: null,
      updateError: '',
      updateErrorServiceId: null,
      lastUpdatedServiceId: null,
    });
    let reportProgress: (snapshot: { bytesTransferred: number; totalBytes: number }) => void;
    const updateService = vi.fn((_service, _file, progress) => {
      state.next({ ...state.value, updatingServiceId: 'service-1' });
      reportProgress = progress;
      return Promise.resolve();
    });
    const toastRef = { close: vi.fn() };
    const toast = { open: vi.fn().mockReturnValue(toastRef), update: vi.fn() };
    TestBed.configureTestingModule({
      imports: [PricesComponent],
      providers: [
        provideRouter([]),
        { provide: AUTH_STATE, useValue: signal('loggedIn') },
        { provide: AuthFunctionsService, useValue: { currentUserProfile: signal(undefined) } },
        { provide: ToastService, useValue: toast },
        {
          provide: ServicesFacade,
          useValue: {
            getServices: () => of([]),
            isLoadingServices: () => of(false),
            getLoadingServicesError: () => of(''),
            getServiceUpdateState: () => state.asObservable(),
            updateService,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(PricesComponent);
    fixture.detectChanges();
    const service: Service = {
      id: 'service-1',
      title: 'Training',
      price: '100',
      time: '1 time',
      description: '',
      image: '',
    };
    const imageFile = new File(['image'], 'photo.png');
    fixture.componentInstance.updateService({ service, imageFile });
    fixture.componentInstance.updateService({ service, imageFile });
    expect(updateService).toHaveBeenCalledOnce();
    reportProgress({ bytesTransferred: 50, totalBytes: 100 });
    expect(fixture.componentInstance.uploadProgress()).toBe(50);
    state.next({ ...state.value, updatingServiceId: null, lastUpdatedServiceId: service.id });
    expect(fixture.componentInstance.uploadProgress()).toBeNull();
    expect(toast.update).toHaveBeenCalledWith(toastRef, 'Ydelsen blev gemt', 'success');
    fixture.destroy();
  });
});
