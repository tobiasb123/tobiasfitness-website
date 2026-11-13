import {
  Component,
  ChangeDetectionStrategy,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { DEFAULT_BLOCKED_DAYS } from '@models/booking/booking-availability';
import { BOOKING_TIME_OPTIONS } from '@models/booking/booking-time-options';
import { BookedSlot, BookingBase, Service, TimePeriod } from '@models/booking/interfaces';
import { AuthFunctionsService } from '@modules/auth';
import { Subscription } from 'rxjs';
import { ToastService } from '../../core/services/toast/toast.service';
import { ContactFunctionsService } from '../services/contact-functions/contact-functions.service';
import { BookingFacade } from '../store/booking.facade';
import { ServicesFacade } from '../store/services.facade';
import { ContactHeaderComponent } from './contact-header/contact-header.component';
import { ContactScheduleStepComponent } from './contact-schedule-step/contact-schedule-step.component';
import { ContactServiceStepComponent } from './contact-service-step/contact-service-step.component';

type ContactStep = 'service' | 'schedule';

@Component({
  selector: 'app-contact',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    ContactHeaderComponent,
    ContactServiceStepComponent,
    ContactScheduleStepComponent,
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent implements OnInit, OnDestroy {
  private subs: Subscription[] = [];
  private authFunctions = inject(AuthFunctionsService);
  private toast = inject(ToastService);
  private contactFunctions = inject(ContactFunctionsService);
  private bookingFacade = inject(BookingFacade);
  private servicesFacade = inject(ServicesFacade);

  private userProfile: UserProfile;

  private readonly profileEffect = effect(() => {
    this.userProfile = this.authFunctions.currentUserProfile();
  });

  currentStep = signal<ContactStep>('service');
  showButtonGroup = signal(false);
  selectedService = signal<Service | null>(null);

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

  hourOptions = signal<string[]>(BOOKING_TIME_OPTIONS);
  blockedDays = signal<number[]>(DEFAULT_BLOCKED_DAYS);
  bookedSlots = signal<BookedSlot[]>([]);

  serviceFormComponents: WritableSignal<Service[]> = signal([]);
  servicesLoading = signal(false);
  servicesError = signal('');
  scheduleLoading = signal(false);
  scheduleError = signal('');
  isBooking = signal(false);

  async ngOnInit(): Promise<void> {
    this.scrollToTop();

    this.subs.push(
      this.servicesFacade.getServices().subscribe((services) => {
        this.serviceFormComponents.set(services);
      }),
    );

    this.subs.push(
      this.servicesFacade.isLoadingServices().subscribe((loading) => {
        this.servicesLoading.set(loading);
      }),
    );

    this.subs.push(
      this.servicesFacade.getLoadingServicesError().subscribe((error) => {
        this.servicesError.set(error || '');
      }),
    );

    await this.loadSchedule();
  }

  async loadSchedule(): Promise<void> {
    if (this.scheduleLoading()) {
      return;
    }

    this.scheduleLoading.set(true);
    this.scheduleError.set('');

    try {
      const [availability, bookedSlots] = await Promise.all([
        this.contactFunctions.getBookingAvailability(),
        this.contactFunctions.getBookedSlots(),
      ]);
      this.hourOptions.set(
        availability.timePeriods.map(
          (period) =>
            `${this.formatTime(Number(period.start.hour), Number(period.start.minute))} - ${this.formatTime(
              Number(period.end.hour),
              Number(period.end.minute),
            )}`,
        ),
      );
      this.blockedDays.set(availability.blockedDays);
      this.bookedSlots.set(bookedSlots);
    } catch {
      this.scheduleError.set('Bookingstiderne kunne ikke hentes. Prøv igen.');
    } finally {
      this.scheduleLoading.set(false);
    }
  }

  onSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (this.isBooking()) {
      return;
    }

    if (this.scheduleLoading() || this.scheduleError()) {
      this.toast.open('Bookingstiderne skal hentes, før du kan booke.', 'error');
      return;
    }

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.toast.open('Vælg en service, dato og tid.', 'error');
      return;
    }

    if (!this.userProfile?.email) {
      this.toast.open('Du skal være logget ind med en gyldig email for at booke.', 'error');
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

    this.isBooking.set(true);
    this.contactFunctions
      .newBooking(newBooking)
      .then((booking) => {
        this.bookingFacade.newBooking(booking);
        this.toast.open('Din booking er registreret', 'success');
        this.bookedSlots.update((slots) => [
          ...slots,
          { date: booking.date, timePeriod: booking.timePeriod },
        ]);
      })
      .catch((error: unknown) => {
        this.toast.open(error instanceof Error && error.message ? error.message : 'Bookingen kunne ikke gennemføres. Prøv igen.', 'error');
      })
      .finally(() => {
        this.isBooking.set(false);
      });
  }

  formatTime(hour: number, minute: number): string {
    return `${(hour + '').padStart(2, '0')}:${(minute + '').padStart(2, '0')}`;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onServiceSelected(service: Service): void {
    this.selectedService.set(service);

    if (service.title === 'Personligt Coachingforløb') {
      this.serviceControl.setValue(service.title + ' - ' + service.time);
    } else {
      this.serviceControl.setValue(service.title);
    }
  }

  goToService(): void {
    this.currentStep.set('service');
    this.showButtonGroup.set(false);
    this.scrollToTop();
  }

  goToSchedule(): void {
    if (!this.serviceControl.valid) {
      this.toast.open('Vælg en service', 'error');
      return;
    }

    this.currentStep.set('schedule');
    this.showButtonGroup.set(true);
    this.scrollToTop();
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
