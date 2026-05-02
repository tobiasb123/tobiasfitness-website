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
  adressControl = new FormControl<string>('', [Validators.required]);
  zipCodeControl = new FormControl<string>('', [Validators.required]);
  townControl = new FormControl<string>('', [Validators.required]);
  dateControl = new FormControl<string>('', [Validators.required]);
  timeControl = new FormControl<string>('', [Validators.required]);
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
    date: this.dateControl,
    time: this.timeControl,
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
  onSubmit(event: SubmitEvent) {
    event.preventDefault();

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
      title: '1 måneds forløb',
      price: 'Pris: 1500kr',
      time: 'Antal gange: 4 x 1 time',
      place: 'Kan forgå i person eller online',
      img: 'Priser_Billede_3.jpeg',
      state: 'Vælg',
      class: 'form-element',
    },
    {
      title: '3 måneders forløb',
      price: 'Pris: 3600kr',
      time: 'Antal gange: 12 x 1 time',
      place: 'Kan forgå i person eller online',
      img: 'Priser_Billede_3.jpeg',
      state: 'Vælg',
      class: 'form-element',
    },
    {
      title: '6 måneders forløb',
      price: 'Pris: 6300kr',
      time: 'Antal gange: 24 x 1 time',
      place: 'Kan forgå i person eller online',
      img: 'Priser_Billede_3.jpeg',
      state: 'Vælg',
      class: 'form-element',
    },
    {
      title: 'Personlig Træning',
      price: 'Pris: 750kr',
      time: 'Antal gange: 1 x 1 time',
      place: 'Forgår i person',
      img: 'Priser_Billede_2.jpeg',
      state: 'Vælg',
      class: 'form-element',
    },
    {
      title: 'Kostvejledning',
      price: 'Pris: 750kr',
      time: 'Antal gange: 1 x 1 time',
      place: 'Kan forgå i person eller online',
      img: 'Priser_Billede_4.jpeg',
      state: 'Vælg',
      class: 'form-element',
    },
    {
      title: 'Lejning til event',
      price: 'Pris: Forhandles',
      time: 'Antal gange: Forhandles',
      place: 'Forgår i person',
      img: 'Priser_Billede_1.jpeg',
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

  hourOptions: Array<string> = [
    '09:00 - 10:00',
    '11:00 - 12:00',
    '13:00 - 14:00',
    '15:00 - 16:00',
    '17:00 - 18:00',
  ];
}
