import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthFunctionsService } from '@modules/auth';
import { FirebaseError } from 'firebase/app';
import { Observable } from 'rxjs';
import { ToastService } from '../../core/services/toast/toast.service';

@Component({
  selector: 'app-signin',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss',
})
export class SigninComponent implements OnInit {
  private toast = inject(ToastService);

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

  ngOnInit(): void {
    this.scrollToTop();
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

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
