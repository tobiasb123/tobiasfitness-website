import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthFunctionsService } from '@modules/auth';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-signup',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComp {
  emailControl = new FormControl<string>('', [Validators.required, Validators.email]);
  passwordControl = new FormControl<string>('', [Validators.required]);

  formGroup = new FormGroup({
    email: this.emailControl,
    password: this.passwordControl,
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

    this.authFunctions.signUp(this.emailControl.value, this.passwordControl.value);
    this.router.navigate(['']);
  }
}
