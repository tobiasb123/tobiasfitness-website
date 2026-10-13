import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DocumentFile } from '@models/storage';
import { ToastService } from '../../../core/services/toast/toast.service';
import { TrainingProgramService } from '../../services/training-program.service';

@Component({
  selector: 'app-training-library',
  imports: [ReactiveFormsModule],
  templateUrl: './training-library.component.html',
  styleUrl: './training-library.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingLibraryComponent implements OnInit {
  private service = inject(TrainingProgramService);
  private toast = inject(ToastService);

  readonly exercises = this.service.exercises;
  readonly search = signal('');
  readonly editingId = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly saving = signal(false);
  readonly loading = signal(true);

  readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();

    return this.exercises().filter((item) =>
      (item.exercise?.name ?? '').toLowerCase().includes(query),
    );
  });

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    explanation: new FormControl('', { nonNullable: true }),
    reps: new FormControl('10 Reps', { nonNullable: true }),
    sets: new FormControl(3, { nonNullable: true, validators: [Validators.min(1)] }),
    intensity: new FormControl('Kropsvægt', { nonNullable: true }),
  });

  async ngOnInit(): Promise<void> {
    try {
      await this.service.loadExercises();
    } catch (error) {
      this.toast.open(this.messageOf(error, 'Kunne ikke hente øvelser'), 'error');
    } finally {
      this.loading.set(false);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  edit(item: DocumentFile): void {
    if (!item.exercise) {
      return;
    }

    this.editingId.set(item.id);
    this.selectedFile.set(null);
    this.form.setValue({
      name: item.exercise.name,
      explanation: item.exercise.explanation,
      reps: item.exercise.reps,
      sets: item.exercise.sets,
      intensity: item.exercise.intensity,
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.selectedFile.set(null);
    this.form.reset({
      name: '',
      explanation: '',
      reps: '10 Reps',
      sets: 3,
      intensity: 'Kropsvægt',
    });
  }

  async submit(): Promise<void> {
    const id = this.editingId();
    const file = this.selectedFile();

    if (this.form.invalid || this.saving() || (!id && !file)) {
      this.form.markAllAsTouched();

      if (!id && !file) {
        this.toast.open('Vælg et billede til øvelsen', 'warning');
      }

      return;
    }

    const exercise = this.form.getRawValue();
    this.saving.set(true);

    try {
      if (id && file) {
        await this.service.replaceExerciseImage(file, exercise, id);
      } else if (id) {
        await this.service.updateExercise({ id, exercise } as DocumentFile);
      } else if (file) {
        await this.service.createExercise(file, exercise);
      }

      await this.service.loadExercises();
      this.resetForm();
      this.toast.open('Øvelsen blev gemt', 'success');
    } catch (error) {
      this.toast.open(this.messageOf(error, 'Øvelsen kunne ikke gemmes'), 'error');
    } finally {
      this.saving.set(false);
    }
  }

  async remove(item: DocumentFile): Promise<void> {
    if (!confirm(`Slet øvelsen "${item.exercise?.name}"?`)) {
      return;
    }

    try {
      await this.service.deleteExercise(item.id);
      await this.service.loadExercises();

      if (this.editingId() === item.id) {
        this.resetForm();
      }

      this.toast.open('Øvelsen blev slettet', 'success');
    } catch (error) {
      this.toast.open(this.messageOf(error, 'Øvelsen kunne ikke slettes'), 'error');
    }
  }

  private messageOf(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }
}
