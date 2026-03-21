import { Component } from '@angular/core';
import { HomeComp } from '../components/home.component';

@Component({
  selector: 'app-home-core',
  imports: [HomeComp],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {}
