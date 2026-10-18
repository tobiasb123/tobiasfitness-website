import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AUTH_STATE, AuthFunctionsService } from '@modules/auth';
import { FirebaseError } from 'firebase/app';
import { ToastService } from '../../core/services/toast/toast.service';

@Component({
  selector: 'app-signin',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss',
})
export class SigninComponent implements OnInit {
  private toast = inject(ToastService);
  private authFunctions = inject(AuthFunctionsService);
  private router = inject(Router);
  private authState = inject(AUTH_STATE);

  emailControl = new FormControl<string>('', [Validators.required, Validators.email]);
  passwordControl = new FormControl<string>('', [Validators.required]);
  rememberMeControl = new FormControl<boolean>(false);

  formGroup = new FormGroup({
    email: this.emailControl,
    password: this.passwordControl,
    rememberMe: this.rememberMeControl,
  });

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

    const toastRef = this.toast.open('Logger ind...', 'loading');

    this.authFunctions
      .signIn(this.emailControl.value, this.passwordControl.value, this.rememberMeControl.value)
      .then(() => {
        this.toast.update(toastRef, 'Logget ind!', 'success');
        this.router.navigate(['']);
      })
      .catch((error: FirebaseError) => {
        toastRef.updateToast({
          type: 'error',
        });
        toastRef.updateMessage(error.message);
      });
  }

  async onResetPassword(): Promise<void> {
    if (this.emailControl.invalid) {
      this.emailControl.markAsTouched();
      return;
    }

    const toastRef = this.toast.open('Sender link til nulstilling...', 'loading');

    try {
      await this.authFunctions.sendPasswordResetEmail(this.emailControl.value);
      this.toast.update(
        toastRef,
        'Hvis emailen er tilknyttet en konto, modtager du snart et link til at nulstille kodeordet.',
        'success',
      );
    } catch (error: unknown) {
      this.toast.update(
        toastRef,
        error instanceof Error ? error.message : 'Der opstod en fejl. Prøv igen senere.',
        'error',
      );
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

}
