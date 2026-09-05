import { Component, computed, input, output } from '@angular/core';
import { Service } from '@models/booking/interfaces';

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

  selectService(service: Service): void {
    this.serviceSelected.emit(service);
  }

  onNext(): void {
    this.nextRequested.emit();
  }
}
