import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FooterComp } from '../components/footer.component';

@Component({
  selector: 'app-footer-core',
  imports: [RouterModule, FooterComp],
  templateUrl: './footer-core.component.html',
  styleUrl: './footer-core.component.scss',
})
export class FooterCoreComponent {}
