import { Component, inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthFunctionsService } from '@modules/auth';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-signin',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss',
})
export class SigninComp {
  emailControl = new FormControl<string>('', [Validators.required, Validators.email]);
  passwordControl = new FormControl<string>('', [Validators.required]);
  rememberMeControl = new FormControl<boolean>(false);

  formGroup = new FormGroup({
    email: this.emailControl,
    password: this.passwordControl,
    rememberMe: this.rememberMeControl,
  });

  private authFunctions = inject(AuthFunctionsService);

  loggedIn: Observable<boolean> = this.authFunctions.isLoggedIn();

  private router = inject(Router);

  onSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.authFunctions.signIn(
      this.emailControl.value,
      this.passwordControl.value,
      this.rememberMeControl.value,
    );
    this.router.navigate(['']);
  }
}
