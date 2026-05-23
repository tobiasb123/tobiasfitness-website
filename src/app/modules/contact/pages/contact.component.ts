import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { Booking, NewBooking } from '@models/booking/interfaces';
import { AuthFunctionsService } from '@modules/auth';
import { FirebaseService } from '@modules/firebase';
import { FirebaseError } from 'firebase/app';
import { ToastService } from '../../core/services/toast/toast.service';

@Component({
  selector: 'app-contact',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private authFunctions = inject(AuthFunctionsService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private firebaseService = inject(FirebaseService);
  private toast = inject(ToastService);

  private userProfile: UserProfile;

  firstNameControl = new FormControl<string>('', [Validators.required]);
  lastNameControl = new FormControl<string>('', [Validators.required]);
  emailControl = new FormControl<string>('', [Validators.required, Validators.email]);
  addressControl = new FormControl<string>('', [Validators.required]);
  zipCodeControl = new FormControl<number>(null, [Validators.required]);
  townControl = new FormControl<string>('', [Validators.required]);
  dateControl = new FormControl<Date>(new Date(), [Validators.required]);
  timeControl = new FormControl<string>('', [Validators.required]);
  serviceControl = new FormControl<string>('');
  extraControl = new FormControl<string>('');
  priceControl = new FormControl<string>('');

  formGroup = new FormGroup({
    firstName: this.firstNameControl,
    lastName: this.lastNameControl,
    email: this.emailControl,
    address: this.addressControl,
    zipCode: this.zipCodeControl,
    town: this.townControl,
    date: this.dateControl,
    time: this.timeControl,
    service: this.serviceControl,
    extra: this.extraControl,
    pris: this.priceControl,
  });

  currentStep: number = 1;

  submitting: boolean = false;
  submitted: boolean = false;
  error: string | null = null;

  ngOnInit(): void {
    this.userProfile = this.authFunctions.currentUserProfile();

    if (this.userProfile) {
      this.firstNameControl.setValue(this.userProfile.firstName);
      this.lastNameControl.setValue(this.userProfile.lastName);
      this.emailControl.setValue(this.userProfile.email);
      this.addressControl.setValue(this.userProfile.address.street);
      this.zipCodeControl.setValue(this.userProfile.address.postalCode);
      this.townControl.setValue(this.userProfile.address.city);
    }
  }

  onSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (!this.emailControl.valid) {
      console.log('No Valid Email.');
      return;
    }

    this.submitting = true;
    this.error = null;

    const newBooking: NewBooking = {
      uid: this.userProfile.uid,
      firstName: this.firstNameControl.value,
      lastName: this.lastNameControl.value,
      email: this.emailControl.value,
      phoneNumber: this.userProfile.phoneNumber,
      date: this.dateControl.value.toString(),
      // FIX TIME PERIOD,
      timePeriod: undefined,
      // FIX TIME PERIOD
      comment: this.extraControl.value,
    };

    this.firebaseService
      .httpPost<NewBooking, Booking>('booking-newBooking', newBooking)
      .then((booking) => {
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
              this.cdr.detectChanges();
              this.toast.open('Din booking er registretet', 'success');
            },
            error: () => {
              this.submitting = false;
              this.error = 'Der skete en fejl. Prøv igen senere.';
              this.currentStep = 4;
              this.updateProgressBgColor();
              this.cdr.detectChanges();
              this.toast.open(this.error, 'error');
            },
          });
      })
      .catch((error: FirebaseError) => {
        this.toast.open(error.message, 'error');
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
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk" eller online',
      img: 'Priser_Billede_3.jpeg',
      state: 'Vælg',
      class: 'form-element',
    },
    {
      title: '3 måneders forløb',
      price: 'Pris: 3600kr',
      time: 'Antal gange: 12 x 1 time',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk" eller online',
      img: 'Priser_Billede_3.jpeg',
      state: 'Vælg',
      class: 'form-element',
    },
    {
      title: '6 måneders forløb',
      price: 'Pris: 6300kr',
      time: 'Antal gange: 24 x 1 time',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk" eller online',
      img: 'Priser_Billede_3.jpeg',
      state: 'Vælg',
      class: 'form-element',
    },
    {
      title: 'Personlig Træning',
      price: 'Pris: 750kr',
      time: 'Antal gange: 1 x 1 time',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk"',
      img: 'Priser_Billede_2.jpeg',
      state: 'Vælg',
      class: 'form-element',
    },
    {
      title: 'Kostvejledning',
      price: 'Pris: 750kr',
      time: 'Antal gange: 1 x 1 time',
      place: 'Forgår på "Østre Havnevej 11c, 4300 Holbæk" eller online',
      img: 'Priser_Billede_4.jpeg',
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
