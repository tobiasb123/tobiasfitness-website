import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../../../Footer/components/footer.component';
import { NavComponent } from '../../components/nav/nav.component';

@Component({
  selector: 'app-core',
  imports: [RouterOutlet, NavComponent, FooterComponent],
  templateUrl: './core.component.html',
  styleUrl: './core.component.scss',
})
export class CoreComponent {}
