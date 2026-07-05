import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { Service } from '@models/booking/interfaces';
import { AuthFunctionsService } from '@modules/auth';
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

  adminitrateEnabled: boolean = false;

  generalServices: WritableSignal<Service[]> = signal([]);

  userProfile: UserProfile;

  async ngOnInit(): Promise<void> {
    this.userProfile = this.authFunctions.currentUserProfile();
    const services = await this.contactFunctions.getServices();
    this.generalServices.set(services);
  }

  adminitrateOptions() {
    this.adminitrateEnabled = !this.adminitrateEnabled;
  }
}
