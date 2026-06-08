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
      price: 'Pris: 750kr',
      time: 'Antal gange: 1 x 1 time',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk"',
      description:
        'Her har du mulighed for at træne sammen med mig, jeg hjælper dig med træningsprogram, træningsplan og din form i alle øvelserne så du får mest muligt ud af din træning.',
      icon: 'Priser_Billede_2.jpeg',
    },
    {
      name: 'Kostvejledning',
      price: 'Pris: 750kr',
      time: 'Antal gange: 1 x 1 time',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk" eller online',
      description:
        'Her har du mulighed for at sætte dig ned sammen med mig og kigge på din kost. Jeg kan hjælpe dig med at, strukturere din kost, håndtere dårlige vaner og hjælpe dig med at sammensætte en kostplan. Dette kan forgå i person eller online.',
      icon: 'Priser_Billede_4.jpeg',
    },
    {
      name: 'Konsultation / PT Klippekort',
      price: 'Pris: 2.400kr',
      time: 'Antal Klip: 4 x 1 time',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk" eller online',
      description: 'Inkludere: Personlig træning, Træningsprogram, Kostvejledning',
      icon: 'Priser_Billede_3.jpeg',
    },
    {
      name: 'Konsultation / PT Klippekort',
      price: 'Pris: 6.000kr',
      time: 'Antal Klip: 12 x 1 time',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk" eller online',
      description: 'Inkludere: Personlig træning, Træningsprogram, Kostvejledning',
      icon: 'Priser_Billede_3.jpeg',
    },
    {
      name: 'Konsultation / PT Klippekort',
      price: 'Pris: 10.000kr',
      time: 'Antal Klip: 24 x 1 time',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk" eller online',
      description: 'Inkludere: Personlig træning, Træningsprogram, Kostvejledning',
      icon: 'Priser_Billede_3.jpeg',
    },
  ];
}
