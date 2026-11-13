import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { BOOKING_TIME_OPTIONS, formatTimePeriodOption } from '@models/booking/booking-time-options';
import {
  Booking,
  CancelBookingRequest,
  RescheduleBookingRequest,
} from '@models/booking/interfaces';
import { AuthFunctionsService } from '@modules/auth';
import { Subscription } from 'rxjs';
import { BookingFacade, ContactFunctionsService } from '../contact';
import moment from '../core/helpers/date-time';
import { ToastService } from '../core/services/toast/toast.service';

export interface BookingRescheduleSelection {
  date: string;
  time: string;
}

@Component({
  selector: 'app-account-management',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './account-management.component.html',
  styleUrl: './account-management.component.scss',
})
export class AccountManagementComponent implements OnInit, OnDestroy {
  public readonly rescheduleTimeOptions = signal<string[]>(BOOKING_TIME_OPTIONS);
  readonly isSavingProfile = signal(false);
  readonly pendingBookingRequests = signal<Record<string, 'reschedule' | 'cancel'>>({});

  private bookingsSubscription?: Subscription;

  private authFunctions = inject(AuthFunctionsService);
  private toast = inject(ToastService);
  private contactFunctions = inject(ContactFunctionsService);
  private bookingFacade = inject(BookingFacade);

  private readonly allBookings = signal<Booking[]>([]);
  public readonly bookings = computed(() => {
    const uid = this.authFunctions.currentUserProfile()?.uid;
    return uid
      ? this.allBookings()
          .filter((booking) => booking.uid === uid)
          .sort((a, b) => a.date.localeCompare(b.date))
      : [];
  });
  public rescheduleSelections = signal<Record<string, BookingRescheduleSelection>>({});

  private readonly profileEffect = effect(() => {
    const profile = this.authFunctions.currentUserProfile();

    if (profile?.uid) {
      this.applyProfile(profile);
    }
  });

  firstNameControl = new FormControl<string>('', [Validators.required]);
  lastNameControl = new FormControl<string>('', [Validators.required]);
  ageControl = new FormControl<number>(null, [
    Validators.required,
    Validators.min(1),
    Validators.max(120),
  ]);
  emailControl = new FormControl<string>('', [Validators.required, Validators.email]);
  phonenumberControl = new FormControl<string>('');
  addressControl = new FormControl<string>('', [Validators.required]);
  postalCodeControl = new FormControl<number>(null, [Validators.required]);
  cityControl = new FormControl<string>('', [Validators.required]);

  formGroup = new FormGroup({
    firstName: this.firstNameControl,
    lastName: this.lastNameControl,
    age: this.ageControl,
    email: this.emailControl,
    phonenumber: this.phonenumberControl,
    address: this.addressControl,
    postalCode: this.postalCodeControl,
    city: this.cityControl,
  });

  private loadBookings(): void {
    if (!this.bookingsSubscription) {
      this.bookingsSubscription = this.bookingFacade
        .getBookings()
        .subscribe((bookings) => this.allBookings.set(bookings));
    }
  }

  public formatBookingDate(date: string): string {
    return moment(date).isValid() ? moment(date).format('DD-MM-YYYY') : date;
  }

  private createDefaultRescheduleSelection(): BookingRescheduleSelection {
    return {
      date: moment().format('YYYY-MM-DD'),
      time: this.rescheduleTimeOptions()[0] ?? '',
    };
  }

  private formatBookingTimeOption(booking: Booking): string {
    return formatTimePeriodOption(booking.timePeriod);
  }

  public getRescheduleSelection(booking: Booking): BookingRescheduleSelection {
    const bookingKey = String(booking.id);
    const existingSelection = this.rescheduleSelections()[bookingKey];

    if (existingSelection) {
      return existingSelection;
    }

    const selectedDate = moment(booking.date).isValid()
      ? moment(booking.date).format('YYYY-MM-DD')
      : this.createDefaultRescheduleSelection().date;

    const bookingTimeOption = this.formatBookingTimeOption(booking);
    const selectedTime = this.rescheduleTimeOptions().includes(bookingTimeOption)
      ? bookingTimeOption
      : this.createDefaultRescheduleSelection().time;

    return {
      date: selectedDate,
      time: selectedTime,
    };
  }

  public updateRescheduleSelection(
    booking: Booking,
    field: keyof BookingRescheduleSelection,
    value: string,
  ): void {
    const bookingId = booking.id;
    const bookingKey = String(bookingId);
    const currentSelections = this.rescheduleSelections();

    this.rescheduleSelections.set({
      ...currentSelections,
      [bookingKey]: {
        ...(currentSelections[bookingKey] ?? this.getRescheduleSelection(booking)),
        [field]: value,
      },
    });
  }

  public async sendRescheduleMail(booking: Booking): Promise<void> {
    if (this.pendingBookingRequests()[booking.id]) {
      return;
    }
    const selection = this.getRescheduleSelection(booking);

    if (!selection.date || !selection.time) {
      this.toast.open('Vælg en ny dato og tid først', 'error');
      return;
    }

    const request: RescheduleBookingRequest = {
      bookingId: booking.id,
      requestedDate: selection.date,
      requestedTime: selection.time,
    };

    this.pendingBookingRequests.update((requests) => ({ ...requests, [booking.id]: 'reschedule' }));
    try {
      await this.contactFunctions.sendRescheduleMail(request);
      this.toast.open('Forespørgsel om omlægning sendt', 'success');
    } catch {
      this.toast.open('Forespørgsel om omlægning kunne ikke sendes', 'error');
    } finally {
      this.clearBookingRequest(booking.id);
    }
  }

  public async sendCancellationMail(booking: Booking): Promise<void> {
    if (this.pendingBookingRequests()[booking.id]) {
      return;
    }
    const request: CancelBookingRequest = {
      bookingId: booking.id,
    };

    this.pendingBookingRequests.update((requests) => ({ ...requests, [booking.id]: 'cancel' }));
    try {
      await this.contactFunctions.sendCancellationMail(request);
      this.toast.open('Forespørgsel om aflysning sendt', 'success');
    } catch {
      this.toast.open('Forespørgsel om aflysning kunne ikke sendes', 'error');
    } finally {
      this.clearBookingRequest(booking.id);
    }
  }

  private clearBookingRequest(id: string): void {
    this.pendingBookingRequests.update((requests) => {
      const updated = { ...requests };
      delete updated[id];
      return updated;
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const availability = await this.contactFunctions.getBookingAvailability();
      this.rescheduleTimeOptions.set(availability.timePeriods.map(formatTimePeriodOption));
    } catch {
      this.toast.open('Bookingstiderne kunne ikke hentes. Standardtider vises.', 'warning');
    }

    const initialProfile = this.authFunctions.currentUserProfile();

    if (initialProfile?.uid) {
      this.applyProfile(initialProfile);
    }
  }

  private applyProfile(profile: UserProfile | undefined): void {
    if (!profile?.uid) {
      return;
    }

    this.loadBookings();

    const address = profile.address;

    this.firstNameControl.setValue(profile.firstName ?? '');
    this.lastNameControl.setValue(profile.lastName ?? '');
    this.ageControl.setValue(profile.age ?? null);
    this.emailControl.setValue(profile.email ?? '');
    this.phonenumberControl.setValue(profile.phoneNumber ?? '');
    this.addressControl.setValue(address?.street ?? '');
    this.postalCodeControl.setValue(address?.postalCode ?? null);
    this.cityControl.setValue(address?.city ?? '');
  }

  async onSubmit(): Promise<void> {
    if (this.isSavingProfile()) {
      return;
    }
    const address = {
      street: this.addressControl.value ?? '',
      postalCode: this.postalCodeControl.value ?? null,
      city: this.cityControl.value ?? '',
    };

    const newData: Partial<UserProfile> = {
      firstName: this.firstNameControl.value ?? '',
      lastName: this.lastNameControl.value ?? '',
      age: this.ageControl.value ?? null,
      email: this.emailControl.value ?? '',
      phoneNumber: this.phonenumberControl.value ?? '',
      address,
    };

    this.isSavingProfile.set(true);
    try {
      const data = await this.authFunctions.updateDetails(newData);
      const updatedProfile = data ?? {};

      this.authFunctions.currentUserProfile.set(updatedProfile as UserProfile);
      this.applyProfile(updatedProfile as UserProfile);

      this.toast.open('Bruger gemt', 'success');
    } catch {
      this.toast.open('Bruger kunne ikke gemmes', 'error');
    } finally {
      this.isSavingProfile.set(false);
    }
  }

  ngOnDestroy(): void {
    this.bookingsSubscription?.unsubscribe();
  }
}
