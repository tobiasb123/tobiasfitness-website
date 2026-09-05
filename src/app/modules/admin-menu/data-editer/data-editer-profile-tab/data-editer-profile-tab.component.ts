import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-data-editer-profile-tab',
  imports: [ReactiveFormsModule],
  templateUrl: './data-editer-profile-tab.component.html',
  styleUrl: './data-editer-profile-tab.component.scss',
})
export class DataEditerProfileTabComponent {
  firstNameControl = input.required<FormControl<string | null>>();
  lastNameControl = input.required<FormControl<string | null>>();
  ageControl = input.required<FormControl<number | null>>();
  emailControl = input.required<FormControl<string | null>>();
  phonenumberControl = input.required<FormControl<string | null>>();
  addressControl = input.required<FormControl<string | null>>();
  zipCodeControl = input.required<FormControl<number | null>>();
  townControl = input.required<FormControl<string | null>>();
  commentControl = input.required<FormControl<string | null>>();
}
