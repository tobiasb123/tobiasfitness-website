import { inject, Injectable, signal } from '@angular/core';
import { DocumentFile, ExerciseTemplate } from '@models/storage';
import {
  SaveTrainingProgramInput,
  SaveTrainingProgramResult,
  TrainingProgram,
  UpdateExerciseWeightInput,
} from '@models/training';
import { FirebaseService } from '@modules/firebase';
import { UploadTaskSnapshot } from 'firebase/storage';
import { StorageFunctions } from '../../meal-prep/services/storage-functions.service';

@Injectable({ providedIn: 'root' })
export class TrainingProgramService {
  private firebaseService = inject(FirebaseService);
  private storageFunctions = inject(StorageFunctions);

  readonly exercises = signal<DocumentFile[]>([]);

  async loadExercises(): Promise<void> {
    const exercises = await this.getExercises();
    this.exercises.set(
      [...exercises].sort((a, b) => (a.exercise?.name ?? '').localeCompare(b.exercise?.name ?? '')),
    );
  }

  getMyPrograms(): Promise<TrainingProgram[]> {
    return this.firebaseService.httpGet<TrainingProgram[]>('training-getMyPrograms');
  }

  getAllPrograms(): Promise<TrainingProgram[]> {
    return this.firebaseService.httpGet<TrainingProgram[]>('training-getAllPrograms');
  }

  saveProgram(program: SaveTrainingProgramInput): Promise<SaveTrainingProgramResult> {
    return this.firebaseService.httpPost<SaveTrainingProgramInput, SaveTrainingProgramResult>(
      'training-saveProgram',
      program,
    );
  }

  async deleteProgram(id: string): Promise<void> {
    await this.firebaseService.httpPost<{ id: string }, void>('training-deleteProgram', { id });
  }

  updateMyExerciseWeight(input: UpdateExerciseWeightInput): Promise<TrainingProgram> {
    return this.firebaseService.httpPost<UpdateExerciseWeightInput, TrainingProgram>(
      'training-updateMyExerciseWeight',
      input,
    );
  }

  updateAnyExerciseIntensity(input: UpdateExerciseWeightInput): Promise<TrainingProgram> {
    return this.firebaseService.httpPost<UpdateExerciseWeightInput, TrainingProgram>(
      'training-updateAnyExerciseIntensity',
      input,
    );
  }

  getProgramImages(programId: string): Promise<Record<string, string>> {
    return this.firebaseService.httpPost<{ programId: string }, Record<string, string>>(
      'training-getProgramImages',
      { programId },
    );
  }

  getExercises(): Promise<DocumentFile[]> {
    return this.firebaseService.httpGet<DocumentFile[]>('storage-getExercises');
  }

  createExercise(
    file: File,
    exercise: ExerciseTemplate,
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
  ): Promise<DocumentFile> {
    return this.storageFunctions.saveExercise(file, exercise, undefined, onProgress).promise;
  }

  replaceExerciseImage(
    file: File,
    exercise: ExerciseTemplate,
    id: string,
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
  ): Promise<DocumentFile> {
    return this.storageFunctions.saveExercise(file, exercise, id, onProgress).promise;
  }

  async updateExercise(file: DocumentFile): Promise<void> {
    await this.firebaseService.httpPost<DocumentFile, void>('storage-editExercise', file);
  }

  async deleteExercise(id: string): Promise<void> {
    await this.firebaseService.httpPost<{ id: string }, void>('storage-deleteExercise', { id });
  }
}
