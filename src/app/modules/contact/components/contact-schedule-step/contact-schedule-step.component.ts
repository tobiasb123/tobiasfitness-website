import { Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact-schedule-step',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-schedule-step.component.html',
  styleUrl: './contact-schedule-step.component.scss',
})
export class ContactScheduleStepComponent {
  active = input(false);
  showButtonGroup = input(false);
  hourOptions = input<string[]>([]);
  dateControl = input.required<FormControl<string | null>>();
  timeControl = input.required<FormControl<string | null>>();

  backRequested = output<void>();

  onBack(): void {
    this.backRequested.emit();
  }
}
