import { Component, input } from '@angular/core';
import { Service } from '@models/booking/interfaces';
import { PricesServicesHeaderComponent } from '../prices-services-header/prices-services-header.component';

@Component({
  selector: 'app-prices-services-list',
  imports: [PricesServicesHeaderComponent],
  templateUrl: './prices-services-list.component.html',
  styleUrl: './prices-services-list.component.scss',
})
export class PricesServicesListComponent {
  services = input<Service[]>([]);
  loading = input(false);
  error = input('');
}
