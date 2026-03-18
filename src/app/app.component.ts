import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CoreComponent } from './modules/core/pages/core/core.component';

@Component({
  selector: 'app-root',
  imports: [CoreComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App {
  protected readonly title = signal('tobiasfitness-website');
}
