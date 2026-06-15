import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-prices',
  imports: [RouterModule],
  templateUrl: './prices.component.html',
  styleUrl: './prices.component.scss',
})
export class PricesComponent {
  generalServices = [
    {
      name: 'Personlig Træning',
      price: 'Pris: 500kr',
      time: 'Tid: 1 time',
      description:
        'Her har du mulighed for at træne sammen med mig, jeg hjælper dig med træningsprogram, træningsplan og din form i alle øvelserne så du får mest muligt ud af din træning.',
      icon: 'Priser_Billede_2.jpeg',
    },
    {
      name: 'Kostvejledning',
      price: 'Pris: 500kr',
      time: 'Tid: 1 time',
      description:
        'Her har du mulighed for at sætte dig ned sammen med mig og kigge på din kost. Jeg kan hjælpe dig med at, strukturere din kost, håndtere dårlige vaner og hjælpe dig med at sammensætte en kostplan. Dette kan forgå i person eller online.',
      icon: 'Priser_Billede_4.jpeg',
    },
    {
      name: 'Personligt Coachingforløb',
      price: 'Pris: 1.500kr',
      time: 'Tid: 1 Måned',
      description:
        'Inkludere: Personlig træning, Træningsprogram, Kostvejledning & Ugentlig check ups',
      icon: 'Priser_Billede_3.jpeg',
    },
    {
      name: 'Personligt Coachingforløb',
      price: 'Pris: 3.600kr',
      time: 'Tid: 3 Måneder',
      description:
        'Inkludere: Personlig træning, Træningsprogram, Kostvejledning & Ugentlig check ups',
      icon: 'Priser_Billede_3.jpeg',
    },
    {
      name: 'Personligt Coachingforløb',
      price: 'Pris: 6.300kr',
      time: 'Tid: 6 Måneder',
      description:
        'Inkludere: Personlig træning, Træningsprogram, Kostvejledning & Ugentlig check ups',
      icon: 'Priser_Billede_3.jpeg',
    },
  ];
}
