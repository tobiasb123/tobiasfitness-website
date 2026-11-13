import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TRAINING_SECTION_LABELS, TRAINING_SECTIONS, TrainingExercise, TrainingProgram } from '@models/training';
import { formatIntensity, intensityLabel, INTENSITY_RATING_PATTERN, INTENSITY_VALUE_PATTERN, isTimeUnit, parseIntensity, repsLabel } from '@models/training/intensity';
import moment from 'moment-timezone';

export interface WeightChange {
  exerciseId: string;
  intensity: string;
}

@Component({
  selector: 'app-training-sheet',
  imports: [ReactiveFormsModule],
  templateUrl: './training-sheet.component.html',
  styleUrl: './training-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingSheetComponent {
  program = input.required<TrainingProgram>();
  images = input<Record<string, string> | null>(null);
  editable = input(false);
  savingExerciseId = input<string | null>(null);

  weightChange = output<WeightChange>();

  editingId = signal<string | null>(null);
  readonly weightControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(INTENSITY_VALUE_PATTERN)],
  });

  startDate = computed(() => this.formatDate(this.program().startDate));
  endDate = computed(() => this.formatDate(this.program().endDate));
  updatedAt = computed(() => this.formatDate(this.program().updatedAt));
  repsColumnLabel = computed(() => {
    const labels = new Set(this.program().exercises.map((exercise) => this.exerciseRepsLabel(exercise)));
    return labels.size === 1 ? [...labels][0] : 'Reps/Tid';
  });
  intensityColumnLabel = computed(() => {
    const labels = new Set(this.program().exercises.map((exercise) => this.exerciseIntensityLabel(exercise)));
    return labels.size === 0 ? 'Intensitet' : labels.size === 1 ? [...labels][0] : 'Vægt/Intensitet';
  });

  // Sections without exercises are hidden; exercises without a section belong to the main program
  sections = computed(() =>
    TRAINING_SECTIONS.map((section) => ({
      section,
      label: TRAINING_SECTION_LABELS[section],
      exercises: this.program().exercises.filter(
        (exercise) => (exercise.section ?? 'training') === section,
      ),
    })).filter((group) => group.exercises.length > 0),
  );

  formatDate(value: string): string {
    return value ? moment(value).format('DD-MM-YYYY') : '';
  }

  imageSrc(exercise: TrainingExercise): string {
    return this.images()?.[exercise.id] ?? exercise.imageUrl;
  }

  startEdit(exercise: TrainingExercise): void {
    this.editingId.set(exercise.id);
    this.weightControl.setValidators([
      Validators.required,
      Validators.pattern(this.isTimeExercise(exercise) ? INTENSITY_RATING_PATTERN : INTENSITY_VALUE_PATTERN),
    ]);
    this.weightControl.setValue(parseIntensity(exercise.intensity).value);
    this.weightControl.markAsUntouched();
  }

  canEditIntensity(exercise: TrainingExercise): boolean {
    const unit = parseIntensity(exercise.intensity).unit;
    return unit === 'kg' || unit === 'time';
  }

  isLegacyIntensity(exercise: TrainingExercise): boolean {
    const unit = parseIntensity(exercise.intensity).unit;
    return unit === 'legacy' || unit === 'legacy-time';
  }

  isTimeExercise(exercise: TrainingExercise): boolean {
    return isTimeUnit(parseIntensity(exercise.intensity).unit);
  }

  exerciseRepsLabel(exercise: TrainingExercise): string {
    return repsLabel(parseIntensity(exercise.intensity).unit, exercise.repsType);
  }

  exerciseIntensityLabel(exercise: TrainingExercise): string {
    return intensityLabel(parseIntensity(exercise.intensity).unit);
  }

  intensityUnit(exercise: TrainingExercise): string {
    return this.isTimeExercise(exercise) ? '/10' : 'kg';
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(exercise: TrainingExercise): void {
    const value = this.weightControl.value.trim();
    const unit = parseIntensity(exercise.intensity).unit;

    if (this.weightControl.invalid || (unit !== 'kg' && unit !== 'time')) {
      this.weightControl.markAsTouched();
      return;
    }

    const intensity = formatIntensity(value, unit);
    this.editingId.set(null);

    if (value !== parseIntensity(exercise.intensity).value) {
      this.weightChange.emit({ exerciseId: exercise.id, intensity });
    }
  }
}
