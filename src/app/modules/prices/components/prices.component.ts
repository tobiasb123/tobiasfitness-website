import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FooterCoreComponent } from '../../Footer/pages/footer-core.component';

@Component({
  selector: 'app-prices',
  imports: [RouterModule, FooterCoreComponent],
  templateUrl: './prices.component.html',
  styleUrl: './prices.component.scss',
})
export class PricesComp {
  generalServices = [
    {
      name: '1 måneds forløb',
      price: 'Pris: 1500kr',
      time: 'Antal gange: 4 x 1 time',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk" eller online',
      description: 'Inkludere: Konsultation, Personlig træning, Træningsprogram og Kostvejledning',
      icon: 'Priser_Billede_3.jpeg',
    },
    {
      name: '3 måneders forløb',
      price: 'Pris: 3600kr',
      time: 'Antal gange: 12 x 1 time',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk" eller online',
      description: 'Inkludere: Konsultation, Personlig træning, Træningsprogram og Kostvejledning',
      icon: 'Priser_Billede_3.jpeg',
    },
    {
      name: '6 måneders forløb',
      price: 'Pris: 6300kr',
      time: 'Antal gange: 24 x 1 time',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk" eller online',
      description: 'Inkludere: Konsultation, Personlig træning, Træningsprogram og Kostvejledning',
      icon: 'Priser_Billede_3.jpeg',
    },
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
      name: 'Lejning til event',
      price: 'Pris: Forhandles',
      time: 'Antal gange: Forhandles',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk"',
      description:
        'Du har mulighed for at leje mig til events på det institut du arbejder for. Jeg kan tilbyde næsten alt inden for fysisk aktivitet, såsom trænings leje, løbeture og en hel masse andet. Det er også en mulighed at leje mig til at lave en opvarmning til et event eller lign.',
      icon: 'Priser_Billede_3.jpeg',
    },
    {
      name: 'Lejning til event',
      price: 'Pris: Forhandles',
      time: 'Antal gange: Forhandles',
      place: 'Forgår i person',
      description:
        'Du har mulighed for at leje mig til events på det institut du arbejder for. Jeg kan tilbyde næsten alt inden for fysisk aktivitet, såsom trænings leje, løbeture og en hel masse andet. Det er også en mulighed at leje mig til at lave en opvarmning til et event eller lign.',
      icon: 'Priser_Billede_3.jpeg',
    },
  ];
}
