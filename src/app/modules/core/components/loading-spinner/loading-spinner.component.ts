import { Component, inject, Input } from '@angular/core';
import { AUTH_STATE } from '@modules/auth';

@Component({
  selector: 'app-loading-spinner',
  imports: [],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss',
})
export class LoadingSpinnerComponent {
  private authState = inject(AUTH_STATE);

  @Input()
  text = 'Indlæser...';

  isAuthLoading(): boolean {
    return this.authState() === 'loading';
  }
}
