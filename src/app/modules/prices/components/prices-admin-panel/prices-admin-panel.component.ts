import { Component, input, output } from '@angular/core';
import { Service } from '@models/booking/interfaces';

@Component({
  selector: 'app-prices-admin-panel',
  templateUrl: './prices-admin-panel.component.html',
  styleUrl: './prices-admin-panel.component.scss',
})
export class PricesAdminPanelComponent {
  services = input<Service[]>([]);
  open = input(false);

  toggleRequested = output<void>();

  onToggle(): void {
    this.toggleRequested.emit();
  }
}
