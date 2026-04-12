import { Component, inject, OnInit } from '@angular/core';
import { CoreComponent } from './modules/core/pages/core/core.component';
import { AuthFunctionsService } from '@modules/auth';

@Component({
  selector: 'app-root',
  imports: [CoreComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App implements OnInit {
  private authFunctions = inject(AuthFunctionsService);

  ngOnInit(): void {
    this.authFunctions.initialize();
  }
}
