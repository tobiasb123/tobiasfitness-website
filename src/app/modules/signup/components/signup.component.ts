import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AUTH_STATE, AuthFunctionsService } from '@modules/auth';
import { FirebaseError } from 'firebase/app';
import { Address } from '../../../../../models/auth/interfaces/address.interface';
import { ToastService } from '../../core/services/toast/toast.service';

@Component({
  selector: 'app-signup',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent implements OnInit {
  private toast = inject(ToastService);
  private authFunctions = inject(AuthFunctionsService);
  private router = inject(Router);
  private authState = inject(AUTH_STATE);

  firstnameControl = new FormControl<string>('', [Validators.required]);
  lastnameControl = new FormControl<string>('', [Validators.required]);
  phonenumberControl = new FormControl<string>('', [Validators.required]);
  streetControl = new FormControl<string>('', [Validators.required]);
  postalCodeControl = new FormControl<number>(null, [Validators.required]);
  cityControl = new FormControl<string>('', [Validators.required]);
  emailControl = new FormControl<string>('', [Validators.required, Validators.email]);
  passwordControl = new FormControl<string>('', [Validators.required]);

  formGroup = new FormGroup({
    firstname: this.firstnameControl,
    lastname: this.lastnameControl,
    phonenumber: this.phonenumberControl,
    street: this.streetControl,
    postalCode: this.postalCodeControl,
    city: this.cityControl,
    email: this.emailControl,
    password: this.passwordControl,
  });

  address: Address = {
    city: this.cityControl.value,
    postalCode: this.postalCodeControl.value,
    street: this.streetControl.value,
  };

  ngOnInit(): void {
    this.scrollToTop();
  }

  isLoggedIn(): boolean {
    return this.authState() === 'loggedIn';
  }

  onSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const toastRef = this.toast.open('Opretter konto...', 'loading');

    this.authFunctions
      .signUp(
        this.emailControl.value,
        this.passwordControl.value,
        this.firstnameControl.value,
        this.lastnameControl.value,
        this.phonenumberControl.value,
        this.address,
      )
      .then(() => {
        this.toast.update(toastRef, 'Konto oprettet!', 'success');
        this.router.navigate(['']);
      })
      .catch((error: FirebaseError) => {
        this.toast.update(toastRef, error.message, 'error');
      });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
