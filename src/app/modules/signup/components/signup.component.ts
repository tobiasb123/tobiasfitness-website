import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthFunctionsService } from '@modules/auth';
import { FirebaseError } from 'firebase/app';
import { Observable } from 'rxjs';
import { Address } from '../../../../../models/auth/interfaces/address.interface';
import { ToastService } from '../../core/services/toast/toast.service';

@Component({
  selector: 'app-signup',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComp {
  private toast = inject(ToastService);

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

  private authFunctions = inject(AuthFunctionsService);

  address: Address = {
    city: this.cityControl.value,
    postalCode: this.postalCodeControl.value,
    street: this.streetControl.value,
  };

  loggedIn: Observable<boolean> = this.authFunctions.isLoggedIn();

  private router = inject(Router);

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
}
