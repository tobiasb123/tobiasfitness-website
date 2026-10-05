import { Component, computed, input, output } from '@angular/core';
import { Service } from '@models/booking/interfaces';
import { LoadingSpinnerComponent } from '../../../core/components/loading-spinner/loading-spinner.component';

const NO_SERVICE_SELECTED: Service = {
  id: '',
  title: 'Ingen service',
  price: 'Pris: 0kr',
  time: 'Tid: 0',
  description: '',
  image: 'Priser_Billede_2.jpeg',
};

@Component({
  selector: 'app-contact-service-step',
  imports: [LoadingSpinnerComponent],
  templateUrl: './contact-service-step.component.html',
  styleUrl: './contact-service-step.component.scss',
})
export class ContactServiceStepComponent {
  services = input<Service[]>([]);
  loading = input(false);
  error = input('');
  active = input(false);
  selectedService = input<Service | null>(null);

  serviceSelected = output<Service>();
  nextRequested = output<void>();

  overviewService = computed(() => this.selectedService() ?? NO_SERVICE_SELECTED);

  isSelected(service: Service): boolean {
    return (
      this.selectedService()?.id === service.id && this.selectedService()?.title === service.title
    );
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

  selectService(service: Service): void {
    this.serviceSelected.emit(service);
  }

  onNext(): void {
    this.nextRequested.emit();
  }
}
