const fs = require('node:fs');
const { applicationDefault, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

function firstNumber(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const match = value.match(/\d+(?:[.,]\d+)?/);
  return match ? match[0] : null;
}

function planDocument(collection, data) {
  const changes = [];
  const unresolved = [];
  const inspect = (exercise, index) => {
    if (!exercise || typeof exercise !== 'object') {
      unresolved.push(index);
      return;
    }
    if (exercise.reps === undefined || exercise.reps === null) return;
    if (typeof exercise.reps !== 'string') {
      unresolved.push(index);
      return;
    }
    const value = exercise.reps;
    if (!value.trim()) return;
    const replacement = firstNumber(value);
    if (replacement === null) {
      unresolved.push(index);
    } else if (replacement !== value) {
      changes.push({ index, before: value, after: replacement });
    }
  };
  if (collection === 'training-programs') {
    if (!Array.isArray(data.exercises)) {
      throw new Error('Training program has an invalid exercises array.');
    }
    data.exercises.forEach(inspect);
  } else {
    inspect(data.exercise, null);
  }
  return { changes, unresolved };
}

async function main() {
  const args = process.argv.slice(2);
  const projectIndex = args.indexOf('--project');
  const backupIndex = args.indexOf('--backup');
  const project = projectIndex >= 0 ? args[projectIndex + 1] : '';
  const apply = args.includes('--apply');
  const backup = backupIndex >= 0 ? args[backupIndex + 1] : '';
  if (!project || project.startsWith('--') || (apply && (!backup || backup.startsWith('--')))) {
    throw new Error('Use --project PROJECT_ID [--apply --backup BACKUP_FILE]. Dry-run is the default.');
  }
  const app = initializeApp({ credential: applicationDefault(), projectId: project });
  const db = getFirestore(app);
  const plans = [];
  let unresolvedCount = 0;
  for (const collection of ['training-programs', 'exercise-library']) {
    const snapshot = await db.collection(collection).get();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const plan = planDocument(collection, data);
      for (const index of plan.unresolved) {
        console.log(`Manual review needed: ${collection}/${doc.id}${index === null ? '' : ` exercise index ${index}`}`);
        unresolvedCount++;
      }
      if (plan.changes.length) {
        plans.push({ collection, ref: doc.ref, updateTime: doc.updateTime, data, changes: plan.changes });
      }
    }
  }
  console.log(`Project ${project}: ${plans.length} documents, ${plans.reduce((n, plan) => n + plan.changes.length, 0)} values to update; ${unresolvedCount} values need manual review.`);
  if (!apply) {
    console.log('Dry-run only; no data was changed.');
    return;
  }

  const backupData = plans.map(({ collection, ref, changes }) => ({
    collection, id: ref.id, changes,
  }));
  fs.writeFileSync(backup, JSON.stringify(backupData, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(`Backup written to ${backup}.`);
  for (const plan of plans) {
    if (plan.collection === 'training-programs') {
      const exercises = plan.data.exercises.map((exercise, index) => {
        const change = plan.changes.find((item) => item.index === index);
        return change ? { ...exercise, reps: change.after } : exercise;
      });
      await plan.ref.update({ exercises }, { lastUpdateTime: plan.updateTime });
    } else {
      await plan.ref.update({ 'exercise.reps': plan.changes[0].after }, { lastUpdateTime: plan.updateTime });
    }
    console.log(`Updated ${plan.collection}/${plan.ref.id}.`);
  }
  console.log('Migration complete. Values without numbers were left unchanged.');
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  });
}

module.exports = { firstNumber, planDocument };
