import {
  Component,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { Booking } from '@models/booking/interfaces';
import { AuthFunctionsService } from '@modules/auth';
import { Subscription } from 'rxjs';
import { BookingFacade, ContactFunctionsService } from '../contact';
import { ToastService } from '../core/services/toast/toast.service';

@Component({
  selector: 'app-account-management',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './account-management.component.html',
  styleUrl: './account-management.component.scss',
})
export class AccountManagementComponent implements OnInit, OnDestroy {
  private subs: Subscription[] = [];

  private authFunctions = inject(AuthFunctionsService);
  private toast = inject(ToastService);
  private contactFunctions = inject(ContactFunctionsService);
  private bookingFacade = inject(BookingFacade);
  private userProfile: UserProfile | undefined;

  public bookings: WritableSignal<Booking[]> = signal([]);

  private readonly profileEffect = effect(() => {
    const profile = this.authFunctions.currentUserProfile();

    if (profile?.uid) {
      this.applyProfile(profile);
    }
  });

  firstNameControl = new FormControl<string>('', [Validators.required]);
  lastNameControl = new FormControl<string>('', [Validators.required]);
  emailControl = new FormControl<string>('', [Validators.required, Validators.email]);
  phonenumberControl = new FormControl<string>('');
  addressControl = new FormControl<string>('', [Validators.required]);
  postalCodeControl = new FormControl<number>(null, [Validators.required]);
  cityControl = new FormControl<string>('', [Validators.required]);

  formGroup = new FormGroup({
    firstName: this.firstNameControl,
    lastName: this.lastNameControl,
    email: this.emailControl,
    phonenumber: this.phonenumberControl,
    address: this.addressControl,
    postalCode: this.postalCodeControl,
    city: this.cityControl,
  });

  private loadBookingsForUser(uid: String): void {
    this.subs.push(
      this.bookingFacade.getBookings().subscribe((bookings) => {
        const userBookings = bookings.filter((booking) => booking.uid === uid);
        this.bookings.set([...userBookings].sort((a, b) => a.date.localeCompare(b.date)));
      }),
    );
  }

  ngOnInit(): void {
    const initialProfile = this.authFunctions.currentUserProfile();

    if (initialProfile?.uid) {
      this.applyProfile(initialProfile);
    }
  }

  private applyProfile(profile: UserProfile | undefined): void {
    this.userProfile = profile;

    if (!profile?.uid) {
      return;
    }

    this.loadBookingsForUser(profile.uid);

    const address = profile.address;

    this.firstNameControl.setValue(profile.firstName ?? '');
    this.lastNameControl.setValue(profile.lastName ?? '');
    this.emailControl.setValue(profile.email ?? '');
    this.phonenumberControl.setValue(profile.phoneNumber ?? '');
    this.addressControl.setValue(address?.street ?? '');
    this.postalCodeControl.setValue(address?.postalCode ?? null);
    this.cityControl.setValue(address?.city ?? '');
  }

  async onSubmit(): Promise<void> {
    this.userProfile = this.authFunctions.currentUserProfile();

    const address = {
      street: this.addressControl.value ?? '',
      postalCode: this.postalCodeControl.value ?? null,
      city: this.cityControl.value ?? '',
    };

    const newData: Partial<UserProfile> = {
      firstName: this.firstNameControl.value ?? '',
      lastName: this.lastNameControl.value ?? '',
      email: this.emailControl.value ?? '',
      phoneNumber: this.phonenumberControl.value ?? '',
      address,
    };

    try {
      const data = await this.authFunctions.updateDetails(newData);
      const updatedProfile = data ?? {};

      this.authFunctions.currentUserProfile.set(updatedProfile as UserProfile);
      this.applyProfile(updatedProfile as UserProfile);

      this.toast.open('Bruger gemt', 'success');
    } catch {
      this.toast.open('Bruger kunne ikke gemmes', 'error');
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
