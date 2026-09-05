import { Component, inject, OnInit } from '@angular/core';
import { AUTH_STATE, AuthFunctionsService } from '@modules/auth';
import { LoadingSpinnerComponent } from './modules/core/components/loading-spinner/loading-spinner.component';
import { CoreComponent } from './modules/core/pages/core/core.component';

@Component({
  selector: 'app-root',
  imports: [CoreComponent, LoadingSpinnerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App implements OnInit {
  private authFunctions = inject(AuthFunctionsService);
  private authState = inject(AUTH_STATE);

  ngOnInit(): void {
    this.authFunctions.initialize();
  }

  isAuthLoading(): boolean {
    return this.authState() === 'loading';
  }
}
