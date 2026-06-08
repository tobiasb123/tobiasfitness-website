import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
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
    pris: this.priceControl,
  });

  hourOptions: Array<string> = [
    '09:00 - 10:00',
    '11:00 - 12:00',
    '13:00 - 14:00',
    '15:00 - 16:00',
    '17:00 - 18:00',
  ];

  serviceFormComponents = [
    {
      title: 'Personlig Træning',
      price: 'Pris: 750kr',
      time: 'Antal gange: 1 x 1 time',
      img: 'Priser_Billede_2.jpeg',
      check: 'service-checkmark.png',
    },
    {
      title: 'Kostvejledning',
      price: 'Pris: 750kr',
      time: 'Antal gange: 1 x 1 time',
      img: 'Priser_Billede_4.jpeg',
      check: 'service-checkmark.png',
    },
    {
      title: 'Konsultation / PT Klippekort',
      price: 'Pris: 2.400kr',
      time: 'Antal Klip: 4',
      img: 'Priser_Billede_4.jpeg',
      check: 'service-checkmark.png',
    },
    {
      title: 'Konsultation / PT Klippekort',
      price: 'Pris: 6.000kr',
      time: 'Antal Klip: 12',
      img: 'Priser_Billede_4.jpeg',
      check: 'service-checkmark.png',
    },
    {
      title: 'Konsultation / PT Klippekort',
      price: 'Pris: 10.000kr',
      time: 'Antal Klip: 24',
      img: 'Priser_Billede_4.jpeg',
      check: 'service-checkmark.png',
    },
  ];

  serviceOverview = [
    {
      title: 'Ingen service',
      price: 'Pris: 0kr',
      time: 'Antal gange: 0',
      img: 'Priser_Billede_2.jpeg',
      check: 'service-checkmark.png',
    },
  ];

  time_period = document.getElementsByClassName('time-period');
  service = document.getElementsByClassName('service');

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

    this.scrollToTop();
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
              // this.updateProgressBgColor();
              this.toast.open('Din booking er registretet', 'success');
            },
            error: () => {
              this.submitting = false;
              this.error = 'Der skete en fejl. Prøv igen senere.';
              // this.updateProgressBgColor();
              this.toast.open(this.error, 'error');
            },
          });
      })
      .then(() => {
        this.currentStep = 4;
      })
      .catch((error: FirebaseError) => {
        this.toast.open(error.message, 'error');
      });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  open_Service_Options() {
    if (this.dateControl.valid && this.timeControl.valid) {
      if (this.time_period[0]) {
        this.time_period[0].classList.remove('focus');
        this.time_period[0].parentElement.classList.add('inside');
      }
      if (this.service[0]) {
        this.service[0].classList.add('focus');
      }
    } else {
      this.toast.open('Dato & Tid er ikke udfyldt', 'error');
    }
  }

  open_Time_Period() {
    if (this.time_period[0]) {
      this.time_period[0].classList.add('focus');
      this.time_period[0].parentElement.classList.add('inside');
    }
    if (this.service[0]) {
      this.service[0].classList.remove('focus');
    }
  }

  to_Booking() {
    if (this.time_period[0]) {
      this.time_period[0].classList.remove('focus');
      this.time_period[0].parentElement.classList.remove('inside');
    }
    if (this.service[0]) {
      this.service[0].classList.remove('focus');
    }
  }

  select_service(event: any) {
    var selectedServiceElement;
    var serviceElements = this.service[0].children[0].children;
    for (let index = 0; index < this.serviceFormComponents.length; index++) {
      const element = this.serviceFormComponents[index];
      var children = event.target.children;
      if (children) {
        if (children[1].innerHTML === element.title) {
          if (children[2].innerHTML === element.time) {
            this.serviceOverview = [element];
            selectedServiceElement = event.target;
            event.target.classList.add('selected');

            if (element.title === 'Personlig Træning Klippekort') {
              var timeSplit = element.time.split(': ')[1];

              this.serviceControl.setValue(element.title + ' x' + timeSplit);
            } else {
              this.serviceControl.setValue(element.title);
            }
          }
        }
      }
    }
    for (let index = 0; index < serviceElements.length; index++) {
      const element = serviceElements[index];
      if (element !== selectedServiceElement) {
        if (element.classList.contains('selected')) {
          element.classList.remove('selected');
        }
      }
    }
  }
}
