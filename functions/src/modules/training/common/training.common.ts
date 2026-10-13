import {
  SaveTrainingProgramInput,
  TrainingExercise,
  TrainingExerciseInput,
  TrainingSection,
} from '@models/training';
import { HttpsError } from 'firebase-functions/https';

// @models is type-only at runtime in functions (no path alias rewrite), so values are kept local
const TRAINING_SECTIONS: readonly TrainingSection[] = ['warmup', 'training', 'cooldown'];

const MAX_EXERCISES = 60;

const text = (value: unknown, maxLength: number): string =>
  String(value ?? '')
    .trim()
    .slice(0, maxLength);

export const commonIsAllowedImageUrl = (url: string): boolean =>
  typeof url === 'string' && url.startsWith('https://firebasestorage.googleapis.com/');

export const commonNormalizeProgramInput = (
  input: SaveTrainingProgramInput,
): Omit<SaveTrainingProgramInput, 'id'> => {
  const assignedToUid = text(input?.assignedToUid, 128);
  const title = text(input?.title, 120);

  if (!assignedToUid) {
    throw new HttpsError('invalid-argument', 'Modtageren er påkrævet');
  }

  if (!title) {
    throw new HttpsError('invalid-argument', 'Programmets titel er påkrævet');
  }

  if (!Array.isArray(input.exercises) || input.exercises.length > MAX_EXERCISES) {
    throw new HttpsError('invalid-argument', 'Øvelserne er ugyldige');
  }

  const ids = new Set<string>();
  const exercises = input.exercises.map((exercise): TrainingExerciseInput => {
    const id = text(exercise.id, 64);
    const name = text(exercise.name, 120);
    const imageUrl = text(exercise.imageUrl, 2048);
    const sets = Math.floor(Number(exercise.sets));

    if (!id || ids.has(id) || !name) {
      throw new HttpsError('invalid-argument', 'Øvelserne er ugyldige');
    }

    if (imageUrl && !commonIsAllowedImageUrl(imageUrl)) {
      throw new HttpsError('invalid-argument', 'Øvelsens billede er ugyldigt');
    }

    ids.add(id);

    const weightUpdatedAt = text(exercise.weightUpdatedAt, 10);

    if (weightUpdatedAt && !/^\d{4}-\d{2}-\d{2}$/.test(weightUpdatedAt)) {
      throw new HttpsError('invalid-argument', 'Datoen for vægtopdatering er ugyldig');
    }

    return {
      id,
      ...(weightUpdatedAt ? { weightUpdatedAt } : {}),
      section: TRAINING_SECTIONS.includes(exercise.section) ? exercise.section : 'training',
      name,
      explanation: text(exercise.explanation, 1000),
      imageUrl,
      reps: text(exercise.reps, 40),
      sets: Number.isFinite(sets) && sets > 0 ? sets : 0,
      intensity: text(exercise.intensity, 40),
    };
  });

  return {
    assignedToUid,
    status: input.status === 'archived' ? 'archived' : 'active',
    title,
    clientName: text(input.clientName, 120),
    injuries: text(input.injuries, 1000),
    goal: text(input.goal, 1000),
    startDate: text(input.startDate, 10),
    endDate: text(input.endDate, 10),
    sessionTime: text(input.sessionTime, 40),
    tempo: text(input.tempo, 40),
    rest: text(input.rest, 40),
    exercises,
  };
};

/**
 * Stamps weightUpdatedAt only for new exercises or exercises whose weight changed.
 */
export const commonResolveExerciseWeights = (
  inputs: TrainingExerciseInput[],
  existing: TrainingExercise[],
  nowIso: string,
): TrainingExercise[] =>
  inputs.map((input) => {
    const previous = existing.find((exercise) => exercise.id === input.id);
    const { weightUpdatedAt: override, ...exercise } = input;

    if (override) {
      return {
        ...exercise,
        weightUpdatedAt: `${override}T12:00:00.000Z`,
        weightUpdatedBy: 'admin',
      };
    }

    if (previous && previous.intensity === input.intensity) {
      return {
        ...exercise,
        weightUpdatedAt: previous.weightUpdatedAt,
        weightUpdatedBy: previous.weightUpdatedBy,
      };
    }

    return { ...exercise, weightUpdatedAt: nowIso, weightUpdatedBy: 'admin' };
  });
