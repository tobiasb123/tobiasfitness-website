import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { Service } from '@models/booking/interfaces';
import { AUTH_STATE, AuthFunctionsService } from '@modules/auth';
import { ToastService } from '@modules/core';
import { ContactFunctionsService } from '../../contact';

@Component({
  selector: 'app-prices',
  imports: [RouterModule],
  templateUrl: './prices.component.html',
  styleUrl: './prices.component.scss',
})
export class PricesComponent implements OnInit {
  contactFunctions = inject(ContactFunctionsService);
  authFunctions = inject(AuthFunctionsService);
  router = inject(Router);
  authState = inject(AUTH_STATE);
  toast = inject(ToastService);

  adminitrateEnabled: boolean = false;

  generalServices: WritableSignal<Service[]> = signal([]);

  userProfile: UserProfile;

  async ngOnInit(): Promise<void> {
    this.userProfile = this.authFunctions.currentUserProfile();
    const services = await this.contactFunctions.getServices();
    this.generalServices.set(services);
  }

  isLoggedIn(): boolean {
    return this.authState() === 'loggedIn';
  }

  adminitrateOptions() {
    this.adminitrateEnabled = !this.adminitrateEnabled;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    if (route === 'signin') {
      this.toast.open('Du skal logge ind først', 'info');
    }
  }
}
