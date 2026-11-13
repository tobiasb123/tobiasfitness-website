export interface ExerciseTemplate {
  name: string;
  explanation: string;
  reps: string;
  repsType?: RepsType;
  sets: number;
  intensity: string;
}
import type { RepsType } from '../../training/intensity';
