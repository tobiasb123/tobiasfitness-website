import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DEFAULT_BLOCKED_DAYS } from '@models/booking/booking-availability';
import { formatTimePeriodOption } from '@models/booking/booking-time-options';
import { BookedSlot } from '@models/booking/interfaces';

interface CalendarDay {
  value: string;
  day: number;
  inCurrentMonth: boolean;
  disabled: boolean;
  label: string;
}

interface TimeOptionItem {
  value: string;
  isBooked: boolean;
}

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
  blockedWeekdays = input<number[]>(DEFAULT_BLOCKED_DAYS);
  bookedSlots = input<BookedSlot[]>([]);
  dateControl = input.required<FormControl<string | null>>();
  timeControl = input.required<FormControl<string | null>>();

  readonly selectedDate = signal<string | null>(null);

  private readonly minimumDateValue = this.toDateValue(this.addDays(new Date(), 2));
  readonly calendarOpen = signal(false);
  readonly timeMenuOpen = signal(false);
  readonly calendarMonth = signal(this.monthStart(this.parseDateValue(this.minimumDateValue)));
  readonly weekDays = ['ma', 'ti', 'on', 'to', 'fr', 'lø', 'sø'];
  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('da-DK', { month: 'long', year: 'numeric' }).format(
      this.calendarMonth(),
    ),
  );
  readonly calendarDays = computed(() => this.buildCalendarDays(this.calendarMonth()));

  readonly bookedTimesForSelectedDate = computed(() => {
    const dateVal = this.selectedDate();
    if (!dateVal) {
      return new Set<string>();
    }
    const booked = this.bookedSlots()
      .filter((slot) => slot.date === dateVal && slot.timePeriod)
      .map((slot) => formatTimePeriodOption(slot.timePeriod));
    return new Set<string>(booked);
  });

  readonly timeOptionItems = computed<TimeOptionItem[]>(() => {
    const bookedSet = this.bookedTimesForSelectedDate();
    return this.hourOptions().map((hour) => ({
      value: hour,
      isBooked: bookedSet.has(hour),
    }));
  });

  constructor() {
    effect(() => {
      // Sync dateControl with internal signal
      const control = this.dateControl();
      this.selectedDate.set(control.value);
    });
  }

  selectedDateLabel(): string {
    const value = this.selectedDate();
    if (!value) {
      return '';
    }

    return new Intl.DateTimeFormat('da-DK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(this.parseDateValue(value));
  }
  readonly canGoToPreviousMonth = computed(
    () => this.calendarMonth().getTime() > this.monthStart(this.minimumDate).getTime(),
  );
  readonly minimumDateLabel = new Intl.DateTimeFormat('da-DK', {
    day: 'numeric',
    month: 'long',
  }).format(this.minimumDate);

  backRequested = output<void>();

  get minimumDate(): Date {
    return this.parseDateValue(this.minimumDateValue);
  }

  toggleCalendar(): void {
    if (this.calendarOpen()) {
      this.closeCalendar();
      return;
    }

    const selectedValue = this.dateControl().value;
    if (selectedValue) {
      this.calendarMonth.set(this.monthStart(this.parseDateValue(selectedValue)));
    }

    this.calendarOpen.set(true);
  }

  closeCalendar(): void {
    this.calendarOpen.set(false);
  }

  toggleTimeMenu(): void {
    this.timeMenuOpen.update((open) => !open);
  }

  closeTimeMenu(): void {
    this.timeMenuOpen.set(false);
  }

  selectTime(time: string, isBooked = false): void {
    if (isBooked) {
      return;
    }

    this.timeControl().setValue(time);
    this.timeControl().markAsTouched();
    this.closeTimeMenu();
  }

  goToPreviousMonth(): void {
    if (this.canGoToPreviousMonth()) {
      this.calendarMonth.update((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1));
    }
  }

  goToNextMonth(): void {
    this.calendarMonth.update((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1));
  }

  selectDate(day: CalendarDay): void {
    if (day.disabled) {
      return;
    }

    this.selectedDate.set(day.value);
    this.dateControl().setValue(day.value);
    this.dateControl().markAsTouched();

    // If currently selected time is booked on the newly selected date, clear it
    const currentTime = this.timeControl().value;
    if (currentTime && this.bookedTimesForSelectedDate().has(currentTime)) {
      this.timeControl().setValue(null);
    }

    this.closeCalendar();
  }

  onBack(): void {
    this.backRequested.emit();
  }

  private buildCalendarDays(month: Date): CalendarDay[] {
    const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + index,
      );
      const value = this.toDateValue(date);
      const dayName = new Intl.DateTimeFormat('da-DK', { weekday: 'long' }).format(date);

      return {
        value,
        day: date.getDate(),
        inCurrentMonth: date.getMonth() === month.getMonth(),
        disabled: value < this.minimumDateValue || this.blockedWeekdays().includes(date.getDay()),
        label: `${dayName} ${date.getDate()}. ${new Intl.DateTimeFormat('da-DK', {
          month: 'long',
          year: 'numeric',
        }).format(date)}`,
      };
    });
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  private monthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private parseDateValue(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toDateValue(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`;
  }
}
