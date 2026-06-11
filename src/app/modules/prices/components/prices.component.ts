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
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk"',
      description:
        'Her har du mulighed for at træne sammen med mig, jeg hjælper dig med træningsprogram, træningsplan og din form i alle øvelserne så du får mest muligt ud af din træning.',
      icon: 'Priser_Billede_2.jpeg',
    },
    {
      name: 'Kostvejledning',
      price: 'Pris: 500kr',
      time: 'Tid: 1 time',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk" eller online',
      description:
        'Her har du mulighed for at sætte dig ned sammen med mig og kigge på din kost. Jeg kan hjælpe dig med at, strukturere din kost, håndtere dårlige vaner og hjælpe dig med at sammensætte en kostplan. Dette kan forgå i person eller online.',
      icon: 'Priser_Billede_4.jpeg',
    },
    {
      name: 'Konsultations- & TræningsForløb',
      price: 'Pris: 1.600kr',
      time: 'Tid: 1 Måned',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk" eller online',
      description:
        'Inkludere: Personlig træning, Træningsprogram, Kostvejledning & Ugentlig check ups',
      icon: 'Priser_Billede_3.jpeg',
    },
    {
      name: 'Konsultations- & TræningsForløb',
      price: 'Pris: 4.000kr',
      time: 'Tid: 3 Måneder',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk" eller online',
      description:
        'Inkludere: Personlig træning, Træningsprogram, Kostvejledning & Ugentlig check ups',
      icon: 'Priser_Billede_3.jpeg',
    },
    {
      name: 'Konsultations- & TræningsForløb',
      price: 'Pris: 7.400kr',
      time: 'Tid: 6 Måneder',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk" eller online',
      description:
        'Inkludere: Personlig træning, Træningsprogram, Kostvejledning & Ugentlig check ups',
      icon: 'Priser_Billede_3.jpeg',
    },
  ];
}
