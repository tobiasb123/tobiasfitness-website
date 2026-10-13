import { ExerciseTemplate } from '@models/storage';
import { HttpsError } from 'firebase-functions/https';

export const commonNormalizeExercise = (exercise?: ExerciseTemplate): ExerciseTemplate => {
  if (!exercise) {
    return undefined;
  }

  const name = String(exercise.name ?? '').trim();

  if (!name) {
    throw new HttpsError('invalid-argument', 'Øvelsens navn er påkrævet');
  }

  const sets = Number(exercise.sets);

  return {
    name,
    explanation: String(exercise.explanation ?? '').trim(),
    reps: String(exercise.reps ?? '').trim(),
    sets: Number.isFinite(sets) && sets > 0 ? Math.floor(sets) : 0,
    intensity: String(exercise.intensity ?? '').trim(),
  };
};
