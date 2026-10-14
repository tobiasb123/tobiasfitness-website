import { UserProfile } from '@models/auth/interfaces';
import {
  SaveTrainingProgramInput,
  TrainingExercise,
  TrainingProgram,
  UpdateExerciseWeightInput,
} from '@models/training';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/https';
import { createAdminEndpoint, createAuthEndpoint } from '../../shared/http';
import { getUser } from '../auth/common/auth.common';
import { sendMail } from '../mail/common/mail.common';
import {
  commonIsAllowedImageUrl,
  commonNormalizeProgramInput,
  commonResolveExerciseWeights,
} from './common/training.common';

const firestore = getFirestore();
const programCollection = firestore.collection('training-programs');
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const toProgram = (id: string, data: FirebaseFirestore.DocumentData): TrainingProgram =>
  ({ ...data, id }) as TrainingProgram;

const sortByUpdatedAt = (programs: TrainingProgram[]): TrainingProgram[] =>
  [...programs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

const readId = (body: unknown, key: string): string =>
  String((body as Record<string, unknown> | undefined)?.[key] ?? '').trim();

const PROGRAM_URL = 'https://tbfitness.dk/training-program';

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const formatDate = (value: string): string =>
  /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10).split('-').reverse().join('-') : value;

const notifyClient = async (
  recipient: UserProfile,
  program: TrainingProgram,
  isUpdate: boolean,
): Promise<void> => {
  if (!recipient.email) {
    return;
  }

  const rows = [
    ['Program', program.title],
    ['Mål', program.goal],
    ['Startdato', formatDate(program.startDate)],
    ['Slutdato', formatDate(program.endDate)],
    ['Antal øvelser', String(program.exercises.length)],
  ]
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<p style="margin: 0 0 8px; font-size: 15px;"><strong>${label}:</strong> ${escapeHtml(value)}</p>`,
    )
    .join('');

  const headline = isUpdate
    ? 'Dit træningsprogram er opdateret'
    : 'Du har fået et nyt træningsprogram';

  await sendMail(
    recipient.email,
    isUpdate ? 'Dit træningsprogram er opdateret' : 'Nyt træningsprogram',
    `<div style="font-family: Arial, sans-serif; background-color: #f5f7fb; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);">
        <div style="background-color: #0f172a; padding: 24px 32px; color: #ffffff;">
          <h2 style="margin: 0 0 8px; font-size: 24px;">${headline}</h2>
          <p style="margin: 0; font-size: 15px; color: #cbd5e1;">Hej ${escapeHtml(recipient.firstName ?? '')} ${escapeHtml(recipient.lastName ?? '')}</p>
        </div>
        <div style="padding: 32px; color: #1f2937;">
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">${rows}</div>
          <p style="margin: 0 0 16px; font-size: 15px;">Du kan se programmet, opdatere dine vægte og hente det som billede direkte på hjemmesiden.</p>
          <p style="margin: 0 0 24px;">
            <a href="${PROGRAM_URL}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: bold;">Se træningsprogram</a>
          </p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #475569;">Hvis du har nogle spørgsmål er du meget velkommen til at kontakte mig via hjemmesiden.</p>
          <p style="margin: 0; font-size: 14px; color: #475569;">Venlig hilsen<br />Tobias Bastholm</p>
        </div>
        <div style="padding: 0 32px 24px;">
          <img src="https://tbfitness.dk/Tobias_Bastholm_Fitness_Logo.png" alt="Firma Logo" width="100%" style="display: block; max-width: 240px; margin: 0 auto;" />
        </div>
      </div>
    </div>`,
  );
};

export const getMyPrograms = createAuthEndpoint(async (req, res, user) => {
  const snapshot = await programCollection.where('assignedToUid', '==', user.uid).get();

  res.json(sortByUpdatedAt(snapshot.docs.map((doc) => toProgram(doc.id, doc.data()))));
});

export const getAllPrograms = createAdminEndpoint(async (req, res) => {
  const snapshot = await programCollection.get();

  res.json(sortByUpdatedAt(snapshot.docs.map((doc) => toProgram(doc.id, doc.data()))));
});

export const saveProgram = createAdminEndpoint(async (req, res) => {
  const input = commonNormalizeProgramInput(req.body as SaveTrainingProgramInput);

  const recipient = await getUser(input.assignedToUid).catch(() => {
    throw new HttpsError('invalid-argument', 'Brugeren blev ikke fundet');
  });

  const nowIso = new Date().toISOString();
  const programId = String((req.body as SaveTrainingProgramInput).id ?? '').trim();
  let existing: TrainingProgram | null = null;

  if (programId) {
    if (programId.includes('/')) {
      throw new HttpsError('invalid-argument', 'Programmets id er ugyldigt');
    }

    const existingDoc = await programCollection.doc(programId).get();

    if (!existingDoc.exists) {
      throw new HttpsError('not-found', 'Træningsprogram blev ikke fundet');
    }

    existing = toProgram(existingDoc.id, existingDoc.data());
  }

  const { exercises: exerciseInputs, ...header } = input;
  const exercises = commonResolveExerciseWeights(exerciseInputs, existing?.exercises ?? [], nowIso);
  const programRef = programId ? programCollection.doc(programId) : programCollection.doc();

  const data = {
    ...header,
    exercises,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };

  await programRef.set(data);

  if (data.status === 'active') {
    await notifyClient(
      { ...recipient, email: recipient.email || (await getAuth().getUser(recipient.uid)).email },
      toProgram(programRef.id, data),
      Boolean(existing),
    ).catch((error): void => {
      console.error('Kunne ikke sende træningsprogram-mail', error);
    });
  }

  res.json(toProgram(programRef.id, data));
});

export const deleteProgram = createAdminEndpoint(async (req, res) => {
  const id = readId(req.body, 'id');

  if (!id || id.includes('/')) {
    throw new HttpsError('invalid-argument', 'Programmets id er påkrævet');
  }

  const programDoc = await programCollection.doc(id).get();

  if (!programDoc.exists) {
    throw new HttpsError('not-found', 'Træningsprogram blev ikke fundet');
  }

  await programDoc.ref.delete();

  res.json({ deleted: true, id });
});

export const updateMyExerciseWeight = createAuthEndpoint(async (req, res, user) => {
  const input = req.body as UpdateExerciseWeightInput;
  const programId = String(input?.programId ?? '').trim();
  const exerciseId = String(input?.exerciseId ?? '').trim();
  const intensity = String(input?.intensity ?? '').trim();

  if (!programId || programId.includes('/') || !exerciseId) {
    throw new HttpsError('invalid-argument', 'Øvelsen er ugyldig');
  }

  if (!intensity || intensity.length > 40) {
    throw new HttpsError('invalid-argument', 'Vægten skal være mellem 1 og 40 tegn');
  }

  const programRef = programCollection.doc(programId);

  const updated = await firestore.runTransaction(async (transaction) => {
    const programDoc = await transaction.get(programRef);

    if (!programDoc.exists || programDoc.data().assignedToUid !== user.uid) {
      throw new HttpsError('not-found', 'Træningsprogram blev ikke fundet');
    }

    const program = toProgram(programDoc.id, programDoc.data());
    const exercise = program.exercises.find((item) => item.id === exerciseId);

    if (!exercise) {
      throw new HttpsError('not-found', 'Øvelsen blev ikke fundet');
    }

    if (exercise.intensity !== intensity) {
      const nowIso = new Date().toISOString();

      exercise.intensity = intensity;
      exercise.weightUpdatedAt = nowIso;
      exercise.weightUpdatedBy = 'client';
      program.updatedAt = nowIso;
      transaction.update(programRef, { exercises: program.exercises, updatedAt: nowIso });
    }

    return program;
  });

  res.json(updated);
});

export const getProgramImages = createAuthEndpoint(async (req, res, user) => {
  const programId = readId(req.body, 'programId');

  if (!programId || programId.includes('/')) {
    throw new HttpsError('invalid-argument', 'Programmets id er påkrævet');
  }

  const programDoc = await programCollection.doc(programId).get();

  if (!programDoc.exists) {
    throw new HttpsError('not-found', 'Træningsprogram blev ikke fundet');
  }

  const program = toProgram(programDoc.id, programDoc.data());

  if (program.assignedToUid !== user.uid) {
    const profile = await getUser(user.uid);

    if (!profile.admin) {
      throw new HttpsError('permission-denied', 'Du har ikke adgang til dette program');
    }
  }

  const images: Record<string, string> = {};

  await Promise.all(
    program.exercises.map(async (exercise: TrainingExercise): Promise<void> => {
      if (!commonIsAllowedImageUrl(exercise.imageUrl)) {
        return;
      }

      const response = await fetch(exercise.imageUrl).catch((): null => null);
      const contentType = response?.headers.get('content-type') ?? '';

      if (!response?.ok || !contentType.startsWith('image/')) {
        return;
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      if (buffer.length <= MAX_IMAGE_BYTES) {
        images[exercise.id] = `data:${contentType};base64,${buffer.toString('base64')}`;
      }
    }),
  );

  res.json(images);
});
