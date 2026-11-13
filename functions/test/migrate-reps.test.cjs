const assert = require('node:assert/strict');
const test = require('node:test');
const { firstNumber, planDocument } = require('../scripts/migrate-reps.cjs');

test('extracts the first number and retains decimal separators', () => {
  assert.equal(firstNumber('10 min'), '10');
  assert.equal(firstNumber('3 x 12'), '3');
  assert.equal(firstNumber('tid: 1,5 min'), '1,5');
  assert.equal(firstNumber('uden antal'), null);
  assert.equal(firstNumber(''), null);
});

test('plans only changes with numbers and reports unresolved text', () => {
  const exercises = [{ reps: '10 min' }, { reps: '12' }, { reps: 'maks' }, { reps: '' }];
  assert.deepEqual(planDocument('training-programs', { exercises }), {
    changes: [{ index: 0, before: '10 min', after: '10' }],
    unresolved: [2],
  });
  assert.deepEqual(planDocument('exercise-library', { exercise: { reps: '3 x 10' } }), {
    changes: [{ index: null, before: '3 x 10', after: '3' }],
    unresolved: [],
  });
  assert.deepEqual(planDocument('training-programs', { exercises: [{ reps: 12 }, null] }), {
    changes: [], unresolved: [0, 1],
  });
});
