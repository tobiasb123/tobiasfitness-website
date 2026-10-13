import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { BookingAvailability } from '@models/booking/interfaces';
import { AdminFunctionsService } from '../../services/admin-functions.service';
import { ToastService } from '../../../core/services/toast/toast.service';
import { ContactFunctionsService } from '../../../contact/services/contact-functions/contact-functions.service';

interface EditableTimePeriod {
  start: string;
  end: string;
}

@Component({
  selector: 'app-booking-availability',
  templateUrl: './booking-availability.component.html',
  styleUrl: './booking-availability.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingAvailabilityComponent implements OnInit {
  private readonly adminFunctions = inject(AdminFunctionsService);
  private readonly contactFunctions = inject(ContactFunctionsService);
  private readonly toast = inject(ToastService);

  readonly weekdays = [
    { value: 1, label: 'Mandag' },
    { value: 2, label: 'Tirsdag' },
    { value: 3, label: 'Onsdag' },
    { value: 4, label: 'Torsdag' },
    { value: 5, label: 'Fredag' },
    { value: 6, label: 'Lørdag' },
    { value: 0, label: 'Søndag' },
  ];

  readonly blockedDays = signal<number[]>([]);
  readonly periods = signal<EditableTimePeriod[]>([]);
  readonly isLoading = signal(true);
  readonly isLoaded = signal(false);
  readonly isSaving = signal(false);
  readonly loadError = signal('');

  async ngOnInit(): Promise<void> {
    await this.loadAvailability();
  }

  async loadAvailability(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');

    try {
      const availability = await this.contactFunctions.getBookingAvailability();
      this.blockedDays.set([...availability.blockedDays]);
      this.periods.set(
        availability.timePeriods.map((period) => ({
          start: this.formatTime(period.start.hour, period.start.minute),
          end: this.formatTime(period.end.hour, period.end.minute),
        })),
      );
      this.isLoaded.set(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bookingstiderne kunne ikke hentes';
      this.loadError.set(message);
      this.toast.open(message, 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleBlockedDay(day: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.blockedDays.update((days) =>
      checked
        ? [...days, day].sort((first, second) => first - second)
        : days.filter((value) => value !== day),
    );
  }

  updatePeriod(index: number, field: keyof EditableTimePeriod, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.periods.update((periods) =>
      periods.map((period, periodIndex) =>
        periodIndex === index ? { ...period, [field]: value } : period,
      ),
    );
  }

  addPeriod(): void {
    const occupied = this.periods().map((period) => ({
      start: this.timeValue(period.start),
      end: this.timeValue(period.end),
    }));

    for (const start of [...Array(15).keys()].map((index) => ((index + 8) % 24) * 60)) {
      const end = start + 60;
      if (!occupied.some((period) => start < period.end && end > period.start)) {
        this.periods.update((periods) => [
          ...periods,
          {
            start: this.formatTime(String(Math.floor(start / 60)), '00'),
            end: this.formatTime(String(Math.floor(end / 60)), '00'),
          },
        ]);
        return;
      }
    }

    this.toast.open('Der er ikke plads til flere tidsrum på en time', 'error');
  }

  removePeriod(index: number): void {
    this.periods.update((periods) => periods.filter((_, periodIndex) => periodIndex !== index));
  }

  async saveAvailability(): Promise<void> {
    const periods = this.periods();
    if (!this.arePeriodsValid(periods)) {
      this.toast.open(
        'Kontrollér tidsrummene. De skal være gyldige og må ikke overlappe.',
        'error',
      );
      return;
    }

    const availability: BookingAvailability = {
      blockedDays: this.blockedDays(),
      timePeriods: periods.map((period) => ({
        start: this.parseTime(period.start),
        end: this.parseTime(period.end),
      })),
    };

    this.isSaving.set(true);
    try {
      await this.adminFunctions.setBookingAvailability(availability);
      this.toast.open('Bookingstiderne er gemt', 'success');
    } catch (error) {
      this.toast.open(
        error instanceof Error ? error.message : 'Bookingstiderne kunne ikke gemmes',
        'error',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  private arePeriodsValid(periods: EditableTimePeriod[]): boolean {
    const validPeriods = periods.map((period) => ({
      start: this.timeValue(period.start),
      end: this.timeValue(period.end),
    }));

    if (
      validPeriods.some(
        (period) =>
          !Number.isInteger(period.start) ||
          !Number.isInteger(period.end) ||
          period.start < 0 ||
          period.end > 24 * 60 ||
          period.start >= period.end,
      )
    ) {
      return false;
    }

    const sortedPeriods = [...validPeriods].sort((first, second) => first.start - second.start);
    return sortedPeriods.every(
      (period, index) => index === 0 || sortedPeriods[index - 1].end <= period.start,
    );
  }

  private timeValue(value: string): number {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
    return match ? Number(match[1]) * 60 + Number(match[2]) : Number.NaN;
  }

  private formatTime(hour: string, minute: string): string {
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }

  private parseTime(value: string): { hour: string; minute: string } {
    const [hour, minute] = value.split(':');
    return { hour, minute };
  }
}
