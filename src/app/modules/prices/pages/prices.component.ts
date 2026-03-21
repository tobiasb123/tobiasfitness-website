import { Component } from '@angular/core';
import { PricesComp } from '../components/prices.component';

@Component({
  selector: 'app-prices-core',
  imports: [PricesComp],
  templateUrl: './prices.component.html',
  styleUrl: './prices.component.scss',
})
export class PricesComponent {}
