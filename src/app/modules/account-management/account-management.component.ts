import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { Booking } from '@models/booking/interfaces';
import { AuthFunctionsService } from '@modules/auth';
import { ContactFunctionsService } from '../contact';
import { ToastService } from '../core/services/toast/toast.service';

@Component({
  selector: 'app-account-management',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './account-management.component.html',
  styleUrl: './account-management.component.scss',
})
export class AccountManagementComponent implements OnInit {
  private authFunctions = inject(AuthFunctionsService);
  private toast = inject(ToastService);
  private contactFunctions = inject(ContactFunctionsService);
  private userProfile: UserProfile;

  public bookings: WritableSignal<Booking[]> = signal([]);

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
    this.contactFunctions.getBookings().then((bookings) => {
      const userBookings = bookings.filter((booking) => booking.uid === uid);
      this.bookings.set([...userBookings].sort((a, b) => a.date.localeCompare(b.date)));
    });
  }

  ngOnInit(): void {
    this.userProfile = this.authFunctions.currentUserProfile();

    this.loadBookingsForUser(this.userProfile.uid);

    if (this.userProfile) {
      this.firstNameControl.setValue(this.userProfile.firstName);
      this.lastNameControl.setValue(this.userProfile.lastName);
      this.emailControl.setValue(this.userProfile.email);
      this.phonenumberControl.setValue(this.userProfile.phoneNumber);
      this.addressControl.setValue(this.userProfile.address.street);
      this.postalCodeControl.setValue(this.userProfile.address.postalCode);
      this.cityControl.setValue(this.userProfile.address.city);
    }
  }

  onSubmit() {
    this.userProfile = this.authFunctions.currentUserProfile();

    const address = {
      street: this.addressControl.value,
      postalCode: this.postalCodeControl.value,
      city: this.cityControl.value,
    };

    const newData: UserProfile = {
      uid: this.userProfile.uid,
      firstName: this.firstNameControl.value,
      lastName: this.lastNameControl.value,
      email: this.emailControl.value,
      phoneNumber: this.phonenumberControl.value,
      address,
    };

    this.authFunctions
      .updateDetails(newData)
      .then(() => {
        this.toast.open('Bruger gemt', 'success');

        this.firstNameControl.setValue(newData.firstName);
        this.lastNameControl.setValue(newData.lastName);
        this.emailControl.setValue(newData.email);
        this.phonenumberControl.setValue(newData.phoneNumber);
        this.addressControl.setValue(newData.address.street);
        this.postalCodeControl.setValue(newData.address.postalCode);
        this.cityControl.setValue(newData.address.city);
      })
      .catch(() => {
        this.toast.open('Bruger kunne ikke gemmes', 'error');
      });
  }
}
