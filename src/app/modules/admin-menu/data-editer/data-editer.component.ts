import { Component, inject, Input, signal, WritableSignal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ɵInternalFormsSharedModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';
import { Booking, TimePeriod } from '@models/booking/interfaces';
import { AuthFunctionsService } from '@modules/auth';
import { ContactFunctionsService } from '../../contact';
import { ToastService } from '../../core/services/toast/toast.service';
import { DataHolderComponent } from '../data-holder/data-holder.component';
import { AdminFunctionsService } from '../services/admin-functions.service';

@Component({
  selector: 'app-data-editer',
  imports: [RouterModule, ɵInternalFormsSharedModule, ReactiveFormsModule],
  templateUrl: './data-editer.component.html',
  styleUrl: './data-editer.component.scss',
})
export class DataEditerComponent {
  private adminFunctions = inject(AdminFunctionsService);
  private contactFunctions = inject(ContactFunctionsService);
  private authfunctions = inject(AuthFunctionsService);
  private dataHolder = inject(DataHolderComponent);
  private toast = inject(ToastService);
  private selectedUserValue: UserProfile;

  firstNameControl = new FormControl<string>('', [Validators.required]);
  lastNameControl = new FormControl<string>('', [Validators.required]);
  emailControl = new FormControl<string>('', [Validators.required, Validators.email]);
  phonenumberControl = new FormControl<string>('', [Validators.required, Validators.email]);
  addressControl = new FormControl<string>('', [Validators.required]);
  zipCodeControl = new FormControl<number>(null, [Validators.required]);
  townControl = new FormControl<string>('', [Validators.required]);
  commentControl = new FormControl<string>('');
  serviceControl = new FormControl<string>('');
  timeControl = new FormControl<string>('');
  dateControl = new FormControl<string>('');

  formGroup = new FormGroup({
    firstName: this.firstNameControl,
    lastName: this.lastNameControl,
    email: this.emailControl,
    phonenumber: this.phonenumberControl,
    address: this.addressControl,
    zipCode: this.zipCodeControl,
    town: this.townControl,
    comment: this.commentControl,
    service: this.serviceControl,
    time: this.timeControl,
    date: this.dateControl,
  });

  @Input()
  set selectedUser(user: UserProfile) {
    this.selectedUserValue = user;
    this.updateSelectedUser(user);
  }

  get selectedUser(): UserProfile {
    return this.selectedUserValue;
  }

  public bookings: WritableSignal<Booking[]> = signal([]);
  public selectedBooking: WritableSignal<Booking> = signal(undefined);

  updateSelectedBooking(bookingId: string): void {
    this.contactFunctions.getBookings().then((bookings) => {
      const booking = bookings.filter((booking) => booking.id === bookingId)[0];
      this.selectedBooking.set(booking);

      const startTime = booking.timePeriod.start.hour + ':' + booking.timePeriod.start.minute;
      const endTime = booking.timePeriod.end.hour + ':' + booking.timePeriod.end.minute;
      const startAndEndTime = startTime + ' - ' + endTime;

      this.serviceControl.setValue(booking.service);
      this.dateControl.setValue(booking.date);
      this.timeControl.setValue(startAndEndTime);
    });
  }

  deleteBooking(id: string): void {
    this.adminFunctions
      .deleteBooking(id)
      .then(() => {
        this.bookings.set(this.bookings().filter((b) => b.id !== id));
        this.loadBookingsForUser(this.selectedUser);
        this.openTab('Tider');
        this.toast.open('Booking Aflyst', 'success');
      })
      .catch(() => {
        this.toast.open('Noget gik galt', 'error');
      });
  }

  editBooking(): void {
    const service: string = this.serviceControl.value;
    const date: string = this.dateControl.value;

    const startAndEndTime = this.timeControl.value.split(' - ');
    const startTime = startAndEndTime[0].split(':');
    const endTime = startAndEndTime[1].split(':');

    const timePeriod: TimePeriod = {
      start: {
        hour: startTime[0],
        minute: startTime[1],
      },
      end: {
        hour: endTime[0],
        minute: endTime[1],
      },
    };
    const editedBooking: Booking = {
      ...this.selectedBooking(),
      service,
      date,
      timePeriod,
    };
    this.adminFunctions
      .editBooking(editedBooking)
      .then(() => {
        this.selectedBooking.set(editedBooking);
        this.loadBookingsForUser(this.selectedUser);
        this.openTab('Tider');
        this.toast.open('Booking Ændret', 'success');
      })
      .catch(() => {
        this.toast.open('Noget gik galt', 'error');
      });
  }

  private updateSelectedUser(user: UserProfile): void {
    if (!user) {
      this.formGroup.reset();
      this.bookings.set([]);
      return;
    }

    this.formGroup.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phonenumber: user.phoneNumber,
      address: user.address.street,
      zipCode: user.address.postalCode,
      town: user.address.city,
    });

    this.loadBookingsForUser(user);
  }

  private setSelectedUser(): UserProfile {
    const uid = this.selectedUser.uid;

    const address = {
      street: this.addressControl.value,
      postalCode: this.zipCodeControl.value,
      city: this.townControl.value,
    };

    const newUser: UserProfile = {
      uid,
      firstName: this.firstNameControl.value,
      lastName: this.lastNameControl.value,
      email: this.emailControl.value,
      phoneNumber: this.phonenumberControl.value,
      address,
    };

    return newUser;
  }

  private loadBookingsForUser(user: UserProfile): void {
    this.contactFunctions.getBookings().then((bookings) => {
      const userBookings = bookings.filter((booking) => booking.uid === user.uid);
      this.bookings.set([...userBookings].sort((a, b) => a.date.localeCompare(b.date)));
    });
  }

  private saveUserSettings(): void {
    this.authfunctions.updateDetails(this.setSelectedUser()).then((user) => {
      this.toast.open('Bruger Gemt', 'success');
    });
  }

  hourOptions: Array<string> = [
    '09:00 - 10:00',
    '11:00 - 12:00',
    '13:00 - 14:00',
    '15:00 - 16:00',
    '17:00 - 18:00',
  ];
  serviceOptions: Array<string> = [
    'Personlig Træning',
    'Kostvejledning',
    'Personligt Coachingforløb - 1 Måned',
    'Personligt Coachingforløb - 3 Måneder',
    'Personligt Coachingforløb - 6 Måneder',
  ];

  allButtons = document.getElementsByClassName('ebn');
  setActiveEditerTabbn(event: any) {
    for (let index = 0; index < this.allButtons.length; index++) {
      const element = this.allButtons[index];
      if (element) {
        if (element.classList.contains('active')) {
          element.classList.remove('active');
          break;
        }
      }
    }
    event.target.classList.add('active');
    this.setActiveEditerTab(event.target.innerHTML);
  }

  allTabs = document.getElementsByClassName('tab');
  setActiveEditerTab(name: string) {
    for (let index = 0; index < this.allTabs.length; index++) {
      const element = this.allTabs[index];
      if (element) {
        if (element.classList.contains('active')) {
          element.classList.remove('active');
        }

        if (element.classList.contains(name)) {
          element.classList.add('active');
        }
      }
    }

    this.selectedBooking.set(null);
    this.dataHolder.loadUsersAndBookings();
  }

  resetTabs() {
    for (let index = 0; index < this.allTabs.length; index++) {
      const element = this.allTabs[index];
      if (element) {
        if (element.classList.contains('active')) {
          element.classList.remove('active');
        }
      }
    }
    for (let index = 0; index < this.allButtons.length; index++) {
      const element = this.allButtons[index];
      if (element) {
        if (element.classList.contains('active')) {
          element.classList.remove('active');
        }
      }
    }

    this.allTabs[0].classList.add('active');
    this.allButtons[0].classList.add('active');

    this.selectedBooking.set(null);
    this.dataHolder.loadUsersAndBookings();
  }

  openTab(tabName: string) {
    for (let index = 0; index < this.allTabs.length; index++) {
      const element = this.allTabs[index];
      if (element) {
        if (element.classList.contains('active')) {
          element.classList.remove('active');
        }
      }
      if (element && element.classList.contains(tabName)) {
        element.classList.add('active');
      }
    }

    this.selectedBooking.set(null);
    this.dataHolder.loadUsersAndBookings();
  }

  openEditTab() {
    for (let index = 0; index < this.allTabs.length; index++) {
      const element = this.allTabs[index];
      if (element.classList.contains('Edit')) {
        element.classList.add('active');
      } else {
        element.classList.remove('active');
      }
    }
  }

  editer = document.getElementsByClassName('data-editer');
  bg = document.getElementsByClassName('bg');
  closeEditer() {
    if (this.editer[0] && this.bg[0]) {
      if (this.editer[0].classList.contains('active') && this.bg[0].classList.contains('active')) {
        this.editer[0].classList.remove('active');
        this.bg[0].classList.remove('active');
      }
    }

    this.resetTabs();
  }

  save() {
    this.saveUserSettings();
  }
}
