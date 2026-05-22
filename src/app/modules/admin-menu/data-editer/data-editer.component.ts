import { Component, effect, Input } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ɵInternalFormsSharedModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserProfile } from '@models/auth/interfaces';

@Component({
  selector: 'app-data-editer',
  imports: [RouterModule, ɵInternalFormsSharedModule, ReactiveFormsModule],
  templateUrl: './data-editer.component.html',
  styleUrl: './data-editer.component.scss',
})
export class DataEditerComponent {
  firstNameControl = new FormControl<string>('', [Validators.required]);
  lastNameControl = new FormControl<string>('', [Validators.required]);
  emailControl = new FormControl<string>('', [Validators.required, Validators.email]);
  phonenumberControl = new FormControl<string>('', [Validators.required, Validators.email]);
  addressControl = new FormControl<string>('', [Validators.required]);
  zipCodeControl = new FormControl<number>(null, [Validators.required]);
  townControl = new FormControl<string>('', [Validators.required]);
  commentControl = new FormControl<string>('');
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
    time: this.timeControl,
    date: this.dateControl,
  });

  @Input()
  selectedUser: UserProfile;

  constructor() {
    effect(() => {
      const user = this.selectedUser;
      if (user) {
        this.formGroup.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phonenumber: user.phoneNumber,
          address: user.address.street,
          zipCode: user.address.postalCode,
          town: user.address.city,
        });
      } else {
        this.formGroup.reset();
      }
    });
  }

  hourOptions: Array<string> = [
    '09:00 - 10:00',
    '11:00 - 12:00',
    '13:00 - 14:00',
    '15:00 - 16:00',
    '17:00 - 18:00',
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

  save() {}
}
