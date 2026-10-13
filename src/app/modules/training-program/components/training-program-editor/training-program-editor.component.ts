import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserProfile } from '@models/auth/interfaces';
import { DocumentFile } from '@models/storage';
import { TRAINING_SECTION_LABELS, TRAINING_SECTIONS, TrainingProgram, TrainingSection } from '@models/training';
import { ToastService } from '../../../core/services/toast/toast.service';
import moment from 'moment-timezone';
import { TrainingProgramService } from '../../services/training-program.service';

const createExerciseGroup = (
  value: {
    id?: string;
    weightDate?: string;
    section?: TrainingSection;
    name?: string;
    explanation?: string;
    imageUrl?: string;
    reps?: string;
    sets?: number;
    intensity?: string;
  } = {},
) =>
  new FormGroup({
    id: new FormControl(value.id ?? crypto.randomUUID(), { nonNullable: true }),
    weightDate: new FormControl(value.weightDate ?? '', { nonNullable: true }),
    section: new FormControl<TrainingSection>(value.section ?? 'training', { nonNullable: true }),
    name: new FormControl(value.name ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    explanation: new FormControl(value.explanation ?? '', { nonNullable: true }),
    imageUrl: new FormControl(value.imageUrl ?? '', { nonNullable: true }),
    reps: new FormControl(value.reps ?? '', { nonNullable: true }),
    sets: new FormControl(value.sets ?? 3, { nonNullable: true }),
    intensity: new FormControl(value.intensity ?? '', { nonNullable: true }),
  });

@Component({
  selector: 'app-training-program-editor',
  imports: [ReactiveFormsModule],
  templateUrl: './training-program-editor.component.html',
  styleUrl: './training-program-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingProgramEditorComponent implements OnInit {
  private service = inject(TrainingProgramService);
  private toast = inject(ToastService);

  users = input<UserProfile[]>([]);

  readonly programs = signal<TrainingProgram[]>([]);
  readonly library = this.service.exercises;
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly loading = signal(true);
  readonly pickerOpen = signal(false);
  private readonly initialWeightDates = new Map<string, string>();
  readonly pickerSection = signal<TrainingSection>('training');
  readonly sectionOptions = TRAINING_SECTIONS.map((value) => ({
    value,
    label: TRAINING_SECTION_LABELS[value],
  }));
  readonly pickerSearch = signal('');
  readonly selectedIds = signal<string[]>([]);
  readonly filteredLibrary = computed(() => {
    const term = this.pickerSearch().trim().toLowerCase();

    return this.library().filter(
      (item: DocumentFile) => !term || (item.exercise?.name ?? '').toLowerCase().includes(term),
    );
  });

  readonly sortedUsers = computed(() =>
    [...this.users()].sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
    ),
  );

  readonly exercises = new FormArray<ReturnType<typeof createExerciseGroup>>([]);
  readonly form = new FormGroup({
    assignedToUid: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<'active' | 'archived'>('active', { nonNullable: true }),
    title: new FormControl('Helkrops Program', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    clientName: new FormControl('', { nonNullable: true }),
    injuries: new FormControl('', { nonNullable: true }),
    goal: new FormControl('', { nonNullable: true }),
    startDate: new FormControl('', { nonNullable: true }),
    endDate: new FormControl('', { nonNullable: true }),
    sessionTime: new FormControl('~ 60 min', { nonNullable: true }),
    tempo: new FormControl('2 - 0 - 0 - 1', { nonNullable: true }),
    rest: new FormControl('1 min', { nonNullable: true }),
    exercises: this.exercises,
  });

  async ngOnInit(): Promise<void> {
    try {
      await Promise.all([this.refreshPrograms(), this.service.loadExercises()]);
    } catch (error) {
      this.toast.open(this.messageOf(error, 'Kunne ikke hente programmer'), 'error');
    } finally {
      this.loading.set(false);
    }
  }

  userName(uid: string): string {
    const user = this.users().find((item) => item.uid === uid);
    return user ? `${user.firstName} ${user.lastName}` : uid;
  }

  onUserChosen(): void {
    const uid = this.form.controls.assignedToUid.value;

    if (!this.form.controls.clientName.value && uid) {
      this.form.controls.clientName.setValue(this.userName(uid));
    }
  }

  addFromLibrary(): void {
    const selected = new Set(this.selectedIds());

    this.library()
      .filter((entry: DocumentFile) => selected.has(entry.id) && entry.exercise)
      .forEach((item) =>
        this.exercises.push(
          createExerciseGroup({
            ...item.exercise,
            imageUrl: item.fileUrl,
            section: this.pickerSection(),
          }),
        ),
      );

    this.closePicker();
  }

  openPicker(): void {
    this.selectedIds.set([]);
    this.pickerSearch.set('');
    this.pickerOpen.set(true);
  }

  closePicker(): void {
    this.pickerOpen.set(false);
    this.selectedIds.set([]);
  }

  toggleSelected(id: string): void {
    this.selectedIds.update((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
  }

  removeExercise(index: number): void {
    this.exercises.removeAt(index);
  }

  moveExercise(index: number, direction: -1 | 1): void {
    const section = this.exercises.at(index).controls.section.value;
    let target = index + direction;

    // Skip over exercises that belong to other sections
    while (
      target >= 0 &&
      target < this.exercises.length &&
      this.exercises.at(target).controls.section.value !== section
    ) {
      target += direction;
    }

    if (target < 0 || target >= this.exercises.length) {
      return;
    }

    const group = this.exercises.at(index);

    this.exercises.removeAt(index);
    this.exercises.insert(target, group);
  }

  isFirstInSection(index: number): boolean {
    return this.neighbourInSection(index, -1) === -1;
  }

  isLastInSection(index: number): boolean {
    return this.neighbourInSection(index, 1) === -1;
  }

  private neighbourInSection(index: number, direction: -1 | 1): number {
    const section = this.exercises.at(index).controls.section.value;

    for (let i = index + direction; i >= 0 && i < this.exercises.length; i += direction) {
      if (this.exercises.at(i).controls.section.value === section) {
        return i;
      }
    }

    return -1;
  }

  edit(program: TrainingProgram): void {
    this.editingId.set(program.id);
    this.exercises.clear();
    this.initialWeightDates.clear();
    program.exercises.forEach((exercise) => {
      const weightDate = exercise.weightUpdatedAt
        ? moment(exercise.weightUpdatedAt).format('YYYY-MM-DD')
        : '';

      this.initialWeightDates.set(exercise.id, weightDate);
      this.exercises.push(createExerciseGroup({ ...exercise, weightDate }));
    });
    this.form.patchValue({
      assignedToUid: program.assignedToUid,
      status: program.status,
      title: program.title,
      clientName: program.clientName,
      injuries: program.injuries,
      goal: program.goal,
      startDate: program.startDate,
      endDate: program.endDate,
      sessionTime: program.sessionTime,
      tempo: program.tempo,
      rest: program.rest,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.exercises.clear();
    this.form.reset();
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    try {
      const raw = this.form.getRawValue();

      await this.service.saveProgram({
        ...raw,
        // Only send the date when the admin changed it, so untouched weights keep their timestamp
        exercises: raw.exercises.map(({ weightDate, ...exercise }) => ({
          ...exercise,
          ...(weightDate && weightDate !== this.initialWeightDates.get(exercise.id)
            ? { weightUpdatedAt: weightDate }
            : {}),
        })),
        id: this.editingId() ?? undefined,
      });
      await this.refreshPrograms();
      this.resetForm();
      this.toast.open('Træningsprogrammet blev gemt', 'success');
    } catch (error) {
      this.toast.open(this.messageOf(error, 'Programmet kunne ikke gemmes'), 'error');
    } finally {
      this.saving.set(false);
    }
  }

  async remove(program: TrainingProgram): Promise<void> {
    if (!confirm(`Slet programmet "${program.title}"?`)) {
      return;
    }

    try {
      await this.service.deleteProgram(program.id);
      await this.refreshPrograms();

      if (this.editingId() === program.id) {
        this.resetForm();
      }

      this.toast.open('Programmet blev slettet', 'success');
    } catch (error) {
      this.toast.open(this.messageOf(error, 'Programmet kunne ikke slettes'), 'error');
    }
  }

  private async refreshPrograms(): Promise<void> {
    this.programs.set(await this.service.getAllPrograms());
  }

  private messageOf(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }
}
