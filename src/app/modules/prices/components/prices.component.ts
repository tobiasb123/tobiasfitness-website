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
  multiServices = [
    {
      name: 'Første Konsultation',
      price: '399kr',
      description:
        'Den første konsultation går ud på at finde ud af hvor du er i dag, hvad du har brug for og hvordan jeg kan hjælpe dig med at nå dine mål.',
      icon: 'Priser_Billede_1.jpeg',
    },
    {
      name: 'Opfølgende Konsultation',
      price: '149kr',
      description:
        'I den opfølgende konsultation tager vi et kig på hvordan det går med både det mentale og fysiske i forhold til de ændringer der er blevet lavet. Og om der skal justeres på noget.',
      icon: 'Priser_Billede_1.jpeg',
    },
    {
      name: 'Første Konsultation - Online',
      price: '299kr',
      description:
        'Den første konsultation går ud på at finde ud af hvor du er i dag, hvad du har brug for og hvordan jeg kan hjælpe dig med at nå dine mål.',
      icon: 'Priser_Billede_3.jpeg',
    },
    {
      name: 'Opfølgende Konsultation - Online',
      price: '99kr',
      description:
        'I den opfølgende konsultation tager vi et kig på hvordan det går med både det mentale og fysiske i forhold til de ændringer der er blevet lavet. Og om der skal justeres på noget.',
      icon: 'Priser_Billede_3.jpeg',
    },
  ];

  singleServices = [
    {
      name: 'Personlig Træning',
      price: '349kr',
      description:
        'Her har du mulighed for at træne sammen med mig, jeg hjælper dig med træningsprogram, træningsplan og din form i alle øvelserne så du får mest muligt ud af din træning.',
      icon: 'Priser_Billede_2.jpeg',
    },
    {
      name: 'Kostvejledning',
      price: '199kr',
      description:
        'Her har du mulighed for at sætte dig ned sammen med mig og kigge på din kost. Jeg kan hjælpe dig med at, strukturere din kost, håndtere dårlige vaner og hjælpe dig med at sammensætte en kostplan. Dette kan forgå i person eller online.',
      icon: 'Priser_Billede_4.jpeg',
    },
  ];
}
