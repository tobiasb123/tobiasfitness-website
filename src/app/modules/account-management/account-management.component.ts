import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { AuthFunctionsService } from '@modules/auth';
import { PassStateService } from '../core/services/pass-state/pass-state.service';

@Component({
  selector: 'app-account-management',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './account-management.component.html',
  styleUrl: './account-management.component.scss',
})
export class AccountManagementComponent implements OnInit {
  private authFunctions = inject(AuthFunctionsService);
  private passStateService = inject(PassStateService);
  private router = inject(Router);
  private userProfile: UserProfile;

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

  setPassState(value: boolean): void {
    this.passStateService.setUsingPass(value);
  }

  usePassAndNavigate(): void {
    this.setPassState(true);
    this.router.navigate(['/contact']);
  }

  ngOnInit(): void {
    this.userProfile = this.authFunctions.currentUserProfile();

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
}
