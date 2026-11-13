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
import { intensityLabel, IntensityUnit, parseIntensity, repsLabel, RepsType } from '@models/training/intensity';
import { ToastService } from '../../../core/services/toast/toast.service';
import { uploadPercentage } from '../../../core/helpers/upload-progress';
import { TrainingProgramService } from '../../services/training-program.service';
import { savedIntensity, validateIntensity } from '../../intensity-form';
import { repsValidator } from '../../reps-validator';

@Component({
  selector: 'app-training-library',
  imports: [ReactiveFormsModule],
  templateUrl: './training-library.component.html',
  styleUrl: './training-library.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingLibraryComponent implements OnInit {
  readonly repsLabel = repsLabel;
  readonly intensityLabel = intensityLabel;
  private service = inject(TrainingProgramService);
  private toast = inject(ToastService);

  readonly exercises = this.service.exercises;
  readonly search = signal('');
  readonly editingId = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly uploadProgress = signal<number | null>(null);
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
    reps: new FormControl('10', { nonNullable: true, validators: [repsValidator('')] }),
    repsType: new FormControl<RepsType>('reps', { nonNullable: true }),
    sets: new FormControl(3, { nonNullable: true, validators: [Validators.min(1)] }),
    intensity: new FormControl('', { nonNullable: true }),
    intensityUnit: new FormControl<IntensityUnit>('bodyweight', { nonNullable: true }),
    originalIntensity: new FormControl('Kropsvægt', { nonNullable: true }),
  }, { validators: validateIntensity });

  async ngOnInit(): Promise<void> {
    this.form.controls.intensityUnit.valueChanges.subscribe(() => {
      this.form.controls.intensity.setValue('');
    });
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
    this.form.controls.reps.setValidators(repsValidator(item.exercise.reps));
    this.form.setValue({
      name: item.exercise.name,
      explanation: item.exercise.explanation,
      reps: item.exercise.reps,
      repsType: item.exercise.repsType ?? 'reps',
      sets: item.exercise.sets,
      intensity: parseIntensity(item.exercise.intensity).value,
      intensityUnit: parseIntensity(item.exercise.intensity).unit,
      originalIntensity: item.exercise.intensity,
    }, { emitEvent: false });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.selectedFile.set(null);
    this.form.controls.reps.setValidators(repsValidator(''));
    this.form.reset({
      name: '',
      explanation: '',
      reps: '10',
      repsType: 'reps',
      sets: 3,
      intensity: '',
      intensityUnit: 'bodyweight',
      originalIntensity: 'Kropsvægt',
    }, { emitEvent: false });
  }

  async submit(): Promise<void> {
    const id = this.editingId();
    const file = this.selectedFile();

    if (this.form.invalid || this.saving() || this.deletingId() || (!id && !file)) {
      this.form.markAllAsTouched();

      if (!id && !file) {
        this.toast.open('Vælg et billede til øvelsen', 'warning');
      }

      return;
    }

    const { intensityUnit, originalIntensity, ...fields } = this.form.getRawValue();
    const exercise = {
      ...fields,
      intensity: savedIntensity(fields.intensity, intensityUnit, originalIntensity),
    };
    this.saving.set(true);

    try {
      if (id && file) {
        await this.service.replaceExerciseImage(file, exercise, id, (snapshot) =>
          this.uploadProgress.set(uploadPercentage(snapshot)),
        );
      } else if (id) {
        await this.service.updateExercise({ id, exercise } as DocumentFile);
      } else if (file) {
        await this.service.createExercise(file, exercise, (snapshot) =>
          this.uploadProgress.set(uploadPercentage(snapshot)),
        );
      }

      await this.service.loadExercises();
      this.resetForm();
      this.toast.open('Øvelsen blev gemt', 'success');
    } catch (error) {
      this.toast.open(this.messageOf(error, 'Øvelsen kunne ikke gemmes'), 'error');
    } finally {
      this.saving.set(false);
      this.uploadProgress.set(null);
    }
  }

  async remove(item: DocumentFile): Promise<void> {
    if (this.deletingId() || this.saving()) {
      return;
    }
    if (!confirm(`Slet øvelsen "${item.exercise?.name}"?`)) {
      return;
    }

    this.deletingId.set(item.id);
    try {
      await this.service.deleteExercise(item.id);
      await this.service.loadExercises();

      if (this.editingId() === item.id) {
        this.resetForm();
      }

      this.toast.open('Øvelsen blev slettet', 'success');
    } catch (error) {
      this.toast.open(this.messageOf(error, 'Øvelsen kunne ikke slettes'), 'error');
    } finally {
      this.deletingId.set(null);
    }
  }

  private messageOf(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }
}
