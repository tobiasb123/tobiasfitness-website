import { Component } from '@angular/core';
import { ContactComp } from '../components/contact.component';

@Component({
  selector: 'app-contact-core',
  imports: [ContactComp],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {}
