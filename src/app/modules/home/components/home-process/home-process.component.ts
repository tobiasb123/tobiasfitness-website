import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-home-process',
  templateUrl: './home-process.component.html',
  styleUrl: './home-process.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeProcessComponent {}
