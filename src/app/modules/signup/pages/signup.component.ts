import { Component } from '@angular/core';
import { SignupComp } from '../components/signup.component';

@Component({
  selector: 'app-signup-core',
  imports: [SignupComp],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {}
