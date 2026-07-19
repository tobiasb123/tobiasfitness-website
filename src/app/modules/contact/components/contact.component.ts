import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { BOOKING_TIME_OPTIONS } from '@models/booking/booking-time-options';
import { BookingBase, Service, TimePeriod } from '@models/booking/interfaces';
import { AuthFunctionsService } from '@modules/auth';
import { FirebaseError } from 'firebase/app';
import { ToastService } from '../../core/services/toast/toast.service';
import { ContactFunctionsService } from '../services/contact-functions/contact-functions.service';
import { BookingFacade } from '../store/booking.facade';

@Component({
  selector: 'app-contact',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private authFunctions = inject(AuthFunctionsService);
  private toast = inject(ToastService);
  private contactFunctions = inject(ContactFunctionsService);
  private bookingFacade = inject(BookingFacade);

  private userProfile: UserProfile;

  showButtonGroup: boolean = false;

  dateControl = new FormControl<string>('', [Validators.required]);
  timeControl = new FormControl<string>('', [Validators.required]);
  serviceControl = new FormControl<string>('', [Validators.required]);
  priceControl = new FormControl<string>('');

  formGroup = new FormGroup({
    date: this.dateControl,
    time: this.timeControl,
    service: this.serviceControl,
    pris: this.priceControl,
  });

  hourOptions: Array<string> = BOOKING_TIME_OPTIONS;

  serviceFormComponents: WritableSignal<Service[]> = signal([]);

  serviceOverview: Service[] = [
    {
      id: '',
      title: 'Ingen service',
      price: 'Pris: 0kr',
      time: 'Tid: 0',
      description: '',
      image: 'Priser_Billede_2.jpeg',
    },
  ];

  time_period = document.getElementsByClassName('time-period');
  service = document.getElementsByClassName('service');

  async ngOnInit(): Promise<void> {
    this.userProfile = this.authFunctions.currentUserProfile();

    this.scrollToTop();

    const services = await this.contactFunctions.getServices();
    this.serviceFormComponents.set(services);
  }

  onSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (!this.userProfile.email) {
      console.log('No Valid Email.');
      return;
    }

    const startAndEndTime = this.timeControl.value.split(' - ');
    const startTime = startAndEndTime[0].split(':');
    const endTime = startAndEndTime[1].split(':');

    const formattedStartTime = this.formatTime(+startTime[0], +startTime[1]).split(':');
    const formattedEndTime = this.formatTime(+endTime[0], +endTime[1]).split(':');

    const timePeriod: TimePeriod = {
      start: {
        hour: formattedStartTime[0],
        minute: formattedStartTime[1],
      },
      end: {
        hour: formattedEndTime[0],
        minute: formattedEndTime[1],
      },
    };

    const newBooking: BookingBase = {
      uid: this.userProfile.uid,
      firstName: this.userProfile.firstName,
      lastName: this.userProfile.lastName,
      email: this.userProfile.email,
      phoneNumber: this.userProfile.phoneNumber,
      date: this.dateControl.value,
      timePeriod: timePeriod,
      service: this.serviceControl.value,
    };

    this.contactFunctions
      .newBooking(newBooking)
      .then((booking) => {
        this.bookingFacade.newBooking(booking);
        this.toast.open('Din booking er registreret', 'success');
      })
      .catch((error: FirebaseError) => {
        this.toast.open(error.message, 'error');
      });
  }

  formatTime(hour: number, minute: number): string {
    return `${(hour + '').padStart(2, '0')}:${(minute + '').padStart(2, '0')}`;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  open_Service_Options() {
    if (this.time_period[0]) {
      this.time_period[0].classList.remove('focus');
      this.time_period[0].parentElement.classList.add('inside');
      this.showButtonGroup = false;
    }
    if (this.service[0]) {
      this.service[0].classList.add('focus');
      this.scrollToTop();
    }
  }

  open_Time_Period() {
    if (this.serviceControl.valid) {
      if (this.time_period[0]) {
        this.time_period[0].classList.add('focus');
        this.time_period[0].parentElement.classList.add('inside');
        this.scrollToTop();
        this.showButtonGroup = true;
      }
      if (this.service[0]) {
        this.service[0].classList.remove('focus');
      }
    } else {
      this.toast.open('Vælg en service', 'error');
    }
  }

  select_service(event: any) {
    var selectedServiceElement;

    var serviceElements = this.service[0].children[0].children;

    for (let index = 0; index < this.serviceFormComponents().length; index++) {
      const element = this.serviceFormComponents()[index];
      var children = event.target.children;

      if (children) {
        if (children[1].innerHTML === element.title) {
          if (children[2].innerHTML === element.time) {
            this.serviceOverview = [element];
            selectedServiceElement = event.target;
            event.target.classList.add('selected');

            if (element.title === 'Personligt Coachingforløb') {
              this.serviceControl.setValue(element.title + ' - ' + element.time);
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
