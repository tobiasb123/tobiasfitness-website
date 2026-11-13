export type TrainingProgramStatus = 'active' | 'archived';
export type WeightUpdatedBy = 'admin' | 'client';
export type TrainingSection = 'warmup' | 'training' | 'cooldown';

export const TRAINING_SECTIONS: readonly TrainingSection[] = ['warmup', 'training', 'cooldown'];

export const TRAINING_SECTION_LABELS: Record<TrainingSection, string> = {
  warmup: 'Opvarmning',
  training: 'Træningsprogram',
  cooldown: 'Nedkøling',
};

export interface TrainingExercise {
  id: string;
  section?: TrainingSection;
  name: string;
  explanation: string;
  imageUrl: string;
  reps: string;
  repsType?: RepsType;
  sets: number;
  intensity: string;
  weightUpdatedAt: string;
  weightUpdatedBy: WeightUpdatedBy;
}

export type TrainingExerciseInput = Omit<TrainingExercise, 'weightUpdatedAt' | 'weightUpdatedBy'> & {
  // Optional admin override, formatted YYYY-MM-DD
  weightUpdatedAt?: string;
};

export interface TrainingProgram {
  id: string;
  assignedToUid: string;
  status: TrainingProgramStatus;
  title: string;
  clientName: string;
  injuries: string;
  goal: string;
  startDate: string;
  endDate: string;
  sessionTime: string;
  tempo: string;
  rest: string;
  exercises: TrainingExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveTrainingProgramInput {
  id?: string;
  sendNotification?: boolean;
  assignedToUid: string;
  status: TrainingProgramStatus;
  title: string;
  clientName: string;
  injuries: string;
  goal: string;
  startDate: string;
  endDate: string;
  sessionTime: string;
  tempo: string;
  rest: string;
  exercises: TrainingExerciseInput[];
}

export type SaveTrainingProgramResult = TrainingProgram & {
  notificationFailed?: boolean;
};

export interface UpdateExerciseWeightInput {
  programId: string;
  exerciseId: string;
  intensity: string;
}
import type { RepsType } from './intensity';
