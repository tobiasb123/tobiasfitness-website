import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, HostBinding } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { form, minLength, validate } from '@angular/forms/signals';
import { RouterModule } from '@angular/router';
import { timeout, timer } from 'rxjs';

@Component({
  selector: 'app-contact',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  firstNameControl = new FormControl<string>('', [Validators.required]);
  lastNameControl = new FormControl<string>('', [Validators.required]);
  emailControl = new FormControl<string>('', [Validators.required, Validators.email]);
  adressControl = new FormControl<string>('');
  zipCodeControl = new FormControl<string>('');
  townControl = new FormControl<string>('');
  serviceControl = new FormControl<string>('');
  extraControl = new FormControl<string>('');

  formGroup = new FormGroup({
    firstName: this.firstNameControl,
    lastName: this.lastNameControl,
    email: this.emailControl,
    adress: this.adressControl,
    zipCode: this.zipCodeControl,
    town: this.townControl,
    service: this.serviceControl,
    extra: this.extraControl,
  });

  currentStep: number = 1;

  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef,
  ) {}

  submitting: boolean = false;
  submitted: boolean = false;
  error: string | null = null;
  onSubmit() {
    if (!this.emailControl.valid) {
      console.log('No Valid Email.');
      return;
    }

    this.submitting = true;
    this.error = null;

    this.http
      .post('https://formspree.io/f/xkozqowa', this.formGroup.value, {
        headers: { Accept: 'application/json' },
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.submitted = true;
          this.currentStep = 4;
          this.updateProgressBgColor();
          this.cd.detectChanges();
        },
        error: (err) => {
          this.submitting = false;
          this.error = 'Der skete en fejl. Prøv igen senere.';
          this.currentStep = 4;
          this.updateProgressBgColor();
          this.cd.detectChanges();
        },
      });
  }

  nextStep() {
    this.currentStep++;
    this.updateProgressBgColor();
  }

  backStep() {
    this.currentStep--;
    this.updateProgressBgColor();
  }

  tryAgain() {
    this.formGroup.reset();

    this.currentStep = 1;
    this.updateProgressBgColor();
  }

  progressLabels = document.getElementsByClassName('progress-label');
  updateProgressBgColor() {
    for (let index = 0; index < this.progressLabels.length; index++) {
      const element = this.progressLabels[index];
      if (element.classList.contains('active')) {
        element.classList.remove('active');
      }
    }
    this.progressLabels[this.currentStep - 1].classList.add('active');

    if (this.currentStep === 4) {
      this.currentStep = 4;
    }
  }

  formLabels = document.getElementsByClassName('form-label');
  checkBox(service: string) {
    if (this.serviceControl.value !== service) {
      this.serviceControl.patchValue(service);
    } else {
      if (this.serviceControl.value === service) {
        this.serviceControl.patchValue('');
      }
    }
    this.checkForActive();
  }

  checkForActive() {
    for (let index = 0; index < this.formLabels.length; index++) {
      const element = this.formLabels[index];
      if (element.innerHTML === this.serviceControl.value) {
        element.parentElement?.classList.add('active');
      } else {
        element.parentElement?.classList.remove('active');
      }
    }
    this.changeButtonText();
  }

  serviceButtons = document.getElementsByClassName('service-button');
  changeButtonText() {
    for (let button = 0; button < this.serviceButtons.length; button++) {
      const element = this.serviceButtons[button];
      if (element.parentElement?.children[0].innerHTML === this.serviceControl.value) {
        element.innerHTML = 'Fjern';
      } else {
        element.innerHTML = 'Vælg';
      }
    }
  }
}
