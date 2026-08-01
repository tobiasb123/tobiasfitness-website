import { Component, inject, Input, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
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
import { DocumentFile } from '@models/storage';
import { AuthFunctionsService } from '@modules/auth';
import { BookingFacade } from '@modules/booking';
import { combineLatest, Subscription } from 'rxjs';
import { ToastService } from '../../core/services/toast/toast.service';
import { AdminFacade } from '../store/admin.facade';

@Component({
  selector: 'app-data-editer',
  imports: [RouterModule, ɵInternalFormsSharedModule, ReactiveFormsModule],
  templateUrl: './data-editer.component.html',
  styleUrl: './data-editer.component.scss',
})
export class DataEditerComponent implements OnInit, OnDestroy {
  private subs: Subscription[] = [];

  private adminFacade = inject(AdminFacade);
  private authfunctions = inject(AuthFunctionsService);
  private toast = inject(ToastService);
  private bookingFacade = inject(BookingFacade);
  private selectedUserValue: UserProfile;
  private activeCommand: 'edit' | 'delete' | null = null;

  firstNameControl = new FormControl<string>('', [Validators.required]);
  lastNameControl = new FormControl<string>('', [Validators.required]);
  ageControl = new FormControl<number>(null, [
    Validators.required,
    Validators.min(1),
    Validators.max(120),
  ]);
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
    age: this.ageControl,
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

  @Input() selectedRecipeInput: DocumentFile;
  @Input() users: UserProfile[] = [];
  @Input() recipeOnlyMode = false;

  public bookings: WritableSignal<Booking[]> = signal([]);
  public selectedBooking: WritableSignal<Booking> = signal(undefined);
  public isDeleteConfirmationOpen = signal(false);
  public isBookingCommandLoading = signal(false);

  ngOnInit(): void {
    this.subs.push(
      this.bookingFacade.getBookings().subscribe((bookings) => {
        this.bookings.set(bookings);
      }),
    );

    this.subs.push(
      this.adminFacade.isBookingCommandLoading().subscribe((loading) => {
        this.isBookingCommandLoading.set(loading);
      }),
    );

    this.subs.push(
      combineLatest([
        this.adminFacade.isBookingCommandCompleted(),
        this.adminFacade.getBookingCommandError(),
        this.adminFacade.getBookingCommandType(),
      ]).subscribe(([completed, error, commandType]) => {
        if (!completed || !this.activeCommand || commandType !== this.activeCommand) {
          return;
        }

        if (this.activeCommand === 'delete') {
          if (error) {
            this.toast.open(error, 'error');
          } else {
            this.isDeleteConfirmationOpen.set(false);
            this.openTab('Tider');
            this.toast.open('Booking Aflyst', 'success');
          }
        }

        if (this.activeCommand === 'edit') {
          if (error) {
            this.toast.open(error, 'error');
          } else {
            this.openTab('Tider');
            this.toast.open('Booking Ændret', 'success');
          }
        }

        this.activeCommand = null;
        this.adminFacade.clearBookingCommandState();
      }),
    );
  }

  updateSelectedBooking(bookingId: string): void {
    const booking = this.bookings().filter((currentBooking) => currentBooking.id === bookingId)[0];
    this.selectedBooking.set(booking);
    this.isDeleteConfirmationOpen.set(false);

    const startTime = booking.timePeriod.start.hour + ':' + booking.timePeriod.start.minute;
    const endTime = booking.timePeriod.end.hour + ':' + booking.timePeriod.end.minute;
    const startAndEndTime = startTime + ' - ' + endTime;

    this.serviceControl.setValue(booking.service);
    this.dateControl.setValue(booking.date);
    this.timeControl.setValue(startAndEndTime);
  }

  deleteBooking(id: string): void {
    if (!id) {
      this.toast.open('Vælg en booking først', 'error');
      return;
    }

    this.activeCommand = 'delete';
    this.adminFacade.deleteBooking(id);
  }

  requestDeleteBooking(): void {
    if (!this.selectedBooking()) {
      this.toast.open('Vælg en booking først', 'error');
      return;
    }

    this.isDeleteConfirmationOpen.set(true);
  }

  cancelDeleteBooking(): void {
    this.isDeleteConfirmationOpen.set(false);
  }

  confirmDeleteBooking(): void {
    this.deleteBooking(this.selectedBooking()?.id);
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

    this.activeCommand = 'edit';
    this.adminFacade.editBooking(editedBooking);
  }

  private updateSelectedUser(user: UserProfile): void {
    if (!user) {
      this.formGroup.reset();
      this.selectedBooking.set(null);
      this.isDeleteConfirmationOpen.set(false);
      return;
    }

    this.formGroup.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      email: user.email,
      phonenumber: user.phoneNumber,
      address: user.address.street,
      zipCode: user.address.postalCode,
      town: user.address.city,
    });
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
      age: this.ageControl.value,
      email: this.emailControl.value,
      phoneNumber: this.phonenumberControl.value,
      address,
    };

    return newUser;
  }

  private saveUserSettings(): void {
    this.authfunctions.updateDetails(this.setSelectedUser()).then(() => {
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
  setActiveEditerTabbn(event: Event) {
    for (let index = 0; index < this.allButtons.length; index++) {
      const element = this.allButtons[index];
      if (element && element.classList.contains('active')) {
        element.classList.remove('active');
        break;
      }
    }

    const target = event.target as HTMLElement;
    target.classList.add('active');
    this.setActiveEditerTab(target.innerHTML);
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
    this.isDeleteConfirmationOpen.set(false);
  }

  resetTabs() {
    for (let index = 0; index < this.allTabs.length; index++) {
      const element = this.allTabs[index];
      if (element && element.classList.contains('active')) {
        element.classList.remove('active');
      }
    }

    for (let index = 0; index < this.allButtons.length; index++) {
      const element = this.allButtons[index];
      if (element && element.classList.contains('active')) {
        element.classList.remove('active');
      }
    }

    if (this.allTabs.length > 0) {
      this.allTabs[0].classList.add('active');
    }
    if (this.allButtons.length > 0) {
      this.allButtons[0].classList.add('active');
    }

    this.selectedBooking.set(null);
    this.isDeleteConfirmationOpen.set(false);
  }

  openTab(tabName: string) {
    for (let index = 0; index < this.allTabs.length; index++) {
      const element = this.allTabs[index];
      if (element && element.classList.contains('active')) {
        element.classList.remove('active');
      }

      if (element && element.classList.contains(tabName)) {
        element.classList.add('active');
      }
    }

    this.selectedBooking.set(null);
    this.isDeleteConfirmationOpen.set(false);
  }

  openEditTab() {
    if (!this.selectedBooking()) {
      this.toast.open('Vælg en booking først', 'error');
      return;
    }

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

  ngOnDestroy(): void {
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
