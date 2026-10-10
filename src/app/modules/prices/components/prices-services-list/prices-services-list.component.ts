import { Component, effect, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Service } from '@models/booking/interfaces';
import { ServiceUpdateState } from '../../../contact/store/services.selectors';
import { LoadingSpinnerComponent } from '../../../core/components/loading-spinner/loading-spinner.component';
import { PricesServicesHeaderComponent } from '../prices-services-header/prices-services-header.component';

@Component({
  selector: 'app-prices-services-list',
  imports: [PricesServicesHeaderComponent, LoadingSpinnerComponent, ReactiveFormsModule],
  templateUrl: './prices-services-list.component.html',
  styleUrl: './prices-services-list.component.scss',
})
export class PricesServicesListComponent {
  private readonly editDialog = viewChild<ElementRef<HTMLDialogElement>>('editDialog');

  services = input<Service[]>([]);
  loading = input(false);
  error = input('');
  isAdmin = input(false);
  serviceUpdateState = input<ServiceUpdateState>({
    updatingServiceId: null,
    updateError: '',
    updateErrorServiceId: null,
    lastUpdatedServiceId: null,
  });
  activeService = signal<Service | null>(null);
  imageError = signal('');
  imagePreview = signal('');
  selectedImage = signal<File | null>(null);
  savePending = signal(false);
  serviceUpdated = output<{ service: Service; imageFile: File | null }>();
  serviceCreated = output<{ service: Service; imageFile: File }>();
  serviceDeleted = output<Service>();
  isNewService = signal(false);

  confirmDelete(service: Service): void {
    if (confirm(`Er du sikker på, at du vil slette "${service.title}"?`)) {
      this.serviceDeleted.emit(service);
    }
  }

  private readonly saveStatusEffect = effect(() => {
    const service = this.activeService();
    const updateState = this.serviceUpdateState();

    if (!service || !this.savePending()) {
      return;
    }

    if (updateState.lastUpdatedServiceId === service.id) {
      this.savePending.set(false);
      this.editDialog()?.nativeElement.close();
    } else if (updateState.updateErrorServiceId === service.id) {
      this.savePending.set(false);
    }
  });

  readonly editForm = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    price: new FormControl('', { nonNullable: true }),
    time: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    image: new FormControl('', { nonNullable: true }),
    hasDiscount: new FormControl(false, { nonNullable: true }),
    discountPercent: new FormControl(10, { nonNullable: true }),
  });

  openCreator(): void {
    this.openEditor({
      id: crypto.randomUUID(),
      title: '',
      price: '',
      time: '',
      description: '',
      image: '',
      discountPercent: 0,
    });
    this.isNewService.set(true);
  }

  openEditor(service: Service): void {
    this.isNewService.set(false);
    this.activeService.set(service);
    this.imageError.set('');
    this.imagePreview.set(service.image);
    this.selectedImage.set(null);
    this.savePending.set(false);
    this.editForm.reset({
      title: service.title,
      price: service.price,
      time: service.time,
      description: service.description,
      image: service.image,
      hasDiscount: (service.discountPercent ?? 0) > 0,
      discountPercent: service.discountPercent ?? 10,
    });
    this.editDialog()?.nativeElement.showModal();
  }

  discountedPrice(service: Service): string | null {
    const discountPercent = service.discountPercent ?? 0;
    const originalPrice = Number(service.price.replace(/\D/g, ''));
    if (discountPercent <= 0 || !Number.isFinite(originalPrice) || originalPrice <= 0) {
      return null;
    }

    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      maximumFractionDigits: 0,
    }).format(Math.round((originalPrice * (100 - discountPercent)) / 100));
  }

  onImageSelected(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const file = input.files?.[0];
    this.imageError.set('');
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.imageError.set('Vælg en billedfil.');
      return;
    }

    this.selectedImage.set(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.imagePreview.set(reader.result);
      } else {
        this.selectedImage.set(null);
        this.imageError.set('Billedet kunne ikke indlæses. Prøv en anden fil.');
      }
    };
    reader.onerror = () => {
      this.selectedImage.set(null);
      this.imageError.set('Billedet kunne ikke indlæses. Prøv en anden fil.');
    };
    reader.readAsDataURL(file);
  }

  saveEdit(): void {
    const service = this.activeService();
    if (!service || this.editForm.invalid) {
      return;
    }

    const { hasDiscount, discountPercent, ...serviceFields } = this.editForm.getRawValue();
    const updatedService = {
      ...service,
      ...serviceFields,
      discountPercent: hasDiscount ? discountPercent : 0,
    };
    const imageFile = this.selectedImage();

    if (this.isNewService()) {
      if (!imageFile) {
        this.imageError.set('Vælg et billede.');
        return;
      }
      this.savePending.set(true);
      this.serviceCreated.emit({ service: updatedService, imageFile });
      return;
    }

    this.savePending.set(true);
    this.serviceUpdated.emit({ service: updatedService, imageFile });
  }

  closeEditor(): void {
    this.activeService.set(null);
    this.selectedImage.set(null);
    this.savePending.set(false);
  }
}
