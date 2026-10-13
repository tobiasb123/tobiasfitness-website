import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TRAINING_SECTION_LABELS, TRAINING_SECTIONS, TrainingExercise, TrainingProgram } from '@models/training';
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
  readonly weightControl = new FormControl('', { nonNullable: true });

  startDate = computed(() => this.formatDate(this.program().startDate));
  endDate = computed(() => this.formatDate(this.program().endDate));
  updatedAt = computed(() => this.formatDate(this.program().updatedAt));

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
    this.weightControl.setValue(exercise.intensity);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(exercise: TrainingExercise): void {
    const intensity = this.weightControl.value.trim();

    if (!intensity) {
      return;
    }

    this.editingId.set(null);

    if (intensity !== exercise.intensity) {
      this.weightChange.emit({ exerciseId: exercise.id, intensity });
    }
  }
}
