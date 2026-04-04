import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FooterCoreComponent } from '../../Footer/pages/footer-core.component';

@Component({
  selector: 'app-home',
  imports: [RouterModule, FooterCoreComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComp {
  goToLink(url: string) {
    window.open(url, '_blank');
  }
}
