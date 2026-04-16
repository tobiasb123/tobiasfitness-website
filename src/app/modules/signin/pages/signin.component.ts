import { Component } from '@angular/core';
import { SigninComp } from '../components/signin.component';

@Component({
  selector: 'app-signin-core',
  imports: [SigninComp],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss',
})
export class SigninComponent {}
