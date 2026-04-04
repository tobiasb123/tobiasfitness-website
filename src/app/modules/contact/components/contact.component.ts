import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FooterCoreComponent } from '../../Footer/pages/footer-core.component';

@Component({
  selector: 'app-contact',
  imports: [RouterModule, ReactiveFormsModule, FooterCoreComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComp {
  firstNameControl = new FormControl<string>('', [Validators.required]);
  lastNameControl = new FormControl<string>('', [Validators.required]);
  emailControl = new FormControl<string>('', [Validators.required, Validators.email]);
  adressControl = new FormControl<string>('');
  zipCodeControl = new FormControl<string>('');
  townControl = new FormControl<string>('');
  serviceControl = new FormControl<string>('');
  extraControl = new FormControl<string>('');
  priceControl = new FormControl<string>('');

  formGroup = new FormGroup({
    firstName: this.firstNameControl,
    lastName: this.lastNameControl,
    email: this.emailControl,
    adress: this.adressControl,
    zipCode: this.zipCodeControl,
    town: this.townControl,
    service: this.serviceControl,
    extra: this.extraControl,
    pris: this.priceControl,
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

  progressLabels = document.getElementsByClassName('progress-label');
  formLabels = document.getElementsByClassName('form-label');
  serviceButtons = document.getElementsByClassName('service-button');

  nextStep() {
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }
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

  serviceFormComponents = [
    {
      title: 'Første Konsultation',
      price: '399kr',
      state: 'Vælg',
      class: 'form-element',
    },
    {
      title: 'Opfølgende Konsultation',
      price: '149kr',
      state: 'Vælg',
      class: 'form-element',
    },
    {
      title: 'Første Konsultation - Online',
      price: '299kr',
      state: 'Vælg',
      class: 'form-element',
    },
    {
      title: 'Opfølgende Konsultation - Online',
      price: '99kr',
      state: 'Vælg',
      class: 'form-element',
    },
    {
      title: 'Personlig Træning',
      price: '349kr',
      state: 'Vælg',
      class: 'form-element',
    },
    {
      title: 'Kostvejledning',
      price: '149kr',
      state: 'Vælg',
      class: 'form-element',
    },
  ];

  checkBox(service: string, price: string, index: number) {
    if (this.serviceControl.value !== service) {
      this.serviceControl.patchValue(service);
      this.priceControl.patchValue(price);
    } else {
      if (this.serviceControl.value === service) {
        this.serviceControl.patchValue('');
        this.priceControl.patchValue('');
      }
    }

    for (let i = 0; i < this.serviceFormComponents.length; i++) {
      const element = this.serviceFormComponents[i];
      if (element !== this.serviceFormComponents[index]) {
        element.state = 'Vælg';
        element.class = 'form-element';
      }
    }

    if (this.serviceFormComponents[index].state === 'Vælg') {
      var tempDic = this.serviceFormComponents[index];
      tempDic.state = 'Fjern';
      tempDic.class = 'form-element active';

      this.serviceFormComponents[index] = tempDic;
      console.log(this.serviceFormComponents[index]);
      return;
    }

    this.serviceFormComponents[index].state = 'Vælg';
    this.serviceFormComponents[index].class = 'form-element';
  }
}
