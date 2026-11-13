const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const buildDir = process.env.FUNCTIONS_BUILD_DIR || path.join(__dirname, '..', 'lib');
const { commonNormalizeExercise } = require(path.join(
  buildDir, 'functions', 'src', 'modules', 'storage', 'common', 'exercise.common.js',
));
const { commonNormalizeProgramInput, commonResolveExerciseWeights } = require(path.join(
  buildDir, 'functions', 'src', 'modules', 'training', 'common', 'training.common.js',
));

const exercise = {
  id: 'exercise-1', name: 'Squat', explanation: '', imageUrl: '', reps: '10',
  sets: 3, intensity: '20 kg', repsType: 'time',
};
const input = { assignedToUid: 'user-1', title: 'Program', exercises: [exercise] };

test('preserves the selected type in library exercises and programs', () => {
  assert.equal(commonNormalizeExercise(exercise).repsType, 'time');
  const normalized = commonNormalizeProgramInput(input).exercises[0];
  assert.equal(normalized.repsType, 'time');
  const previous = { ...exercise, repsType: 'reps', weightUpdatedAt: 'original', weightUpdatedBy: 'client' };
  assert.deepEqual(commonResolveExerciseWeights([normalized], [previous], 'now')[0], {
    ...normalized, weightUpdatedAt: 'original', weightUpdatedBy: 'client',
  });
});

test('accepts existing exercises without a type and rejects invalid types', () => {
  const { repsType, ...legacy } = exercise;
  assert.equal(commonNormalizeExercise(legacy).repsType, undefined);
  assert.equal(commonNormalizeProgramInput({ ...input, exercises: [legacy] }).exercises[0].repsType, undefined);
  assert.throws(() => commonNormalizeExercise({ ...exercise, repsType: 'invalid' }));
  assert.throws(() => commonNormalizeProgramInput({
    ...input, exercises: [{ ...exercise, repsType: 'invalid' }],
  }));
});
