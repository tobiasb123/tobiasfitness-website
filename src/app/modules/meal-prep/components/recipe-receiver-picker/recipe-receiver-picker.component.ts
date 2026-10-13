import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UserProfile } from '@models/auth/interfaces';

const ALL_RECEIVERS = 'all';

@Component({
  selector: 'app-recipe-receiver-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="receiver-picker">
      <legend>Modtagere</legend>

      <input
        type="search"
        class="receiver-search"
        placeholder="Søg efter bruger"
        aria-label="Søg efter bruger"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
      />

      <label class="receiver-option">
        <input type="checkbox" [checked]="isAll()" (change)="toggleAll()" />
        <span>Alle</span>
      </label>

      @for (user of filteredUsers(); track user.uid) {
        <label class="receiver-option">
          <input
            type="checkbox"
            [checked]="isSelected(user.uid)"
            (change)="toggleUser(user.uid)"
          />
          <span>{{ user.firstName }} {{ user.lastName }}</span>
        </label>
      } @empty {
        <small>Ingen brugere fundet</small>
      }
    </fieldset>
  `,
  styles: `
    .receiver-search {
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 6px;
    }

    .receiver-picker {
      border: 1px solid rgba(128, 128, 128, 0.4);
      border-radius: 8px;
      padding: 8px 12px;
      margin: 0;
      max-height: 200px;
      overflow-y: auto;
    }

    .receiver-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      cursor: pointer;
    }
  `,
})
export class RecipeReceiverPickerComponent {
  control = input.required<FormControl<string[]>>();
  users = input<UserProfile[]>([]);
  query = signal('');

  filteredUsers = computed(() => {
    const query = this.query().trim().toLowerCase();

    if (!query) {
      return this.users();
    }

    const queryDigits = query.replace(/\D/g, '');

    return this.users().filter((user) => {
      const haystack = `${user.firstName} ${user.lastName} ${user.email ?? ''}`.toLowerCase();
      const phone = (user.phoneNumber ?? '').replace(/\D/g, '');

      return haystack.includes(query) || (!!queryDigits && phone.includes(queryDigits));
    });
  });

  isAll(): boolean {
    return this.control().value.includes(ALL_RECEIVERS);
  }

  isSelected(uid: string): boolean {
    return this.control().value.includes(uid);
  }

  toggleAll(): void {
    this.control().setValue(this.isAll() ? [] : [ALL_RECEIVERS]);
    this.control().markAsDirty();
  }

  toggleUser(uid: string): void {
    const current = this.control().value.filter((item) => item !== ALL_RECEIVERS);
    const next = current.includes(uid) ? current.filter((item) => item !== uid) : [...current, uid];
    this.control().setValue(next);
    this.control().markAsDirty();
  }
}
