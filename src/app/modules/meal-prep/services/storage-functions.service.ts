import { inject, Injectable } from '@angular/core';
import {
  CreateUploadIntentInput,
  CreateUploadIntentReturn,
  DocumentFile,
  ExerciseTemplate,
  FileType,
  FinalizeUploadInput,
  Recipe,
  Review,
} from '@models/storage';
import { FirebaseService } from '@modules/firebase';
import {
  FirebaseStorage,
  getStorage,
  ref,
  uploadBytesResumable,
  UploadTask,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { FIREBASE_APP } from '../../firebase/tokens/firebase-app.token';
import { toRecipeReceiverFields } from '../utils/recipe-receivers.util';

export interface ResumableUpload {
  cancel: () => void;
  promise: Promise<DocumentFile>;
}

@Injectable({
  providedIn: 'root',
})
export class StorageFunctions {
  private firbaseService = inject(FirebaseService);
  private firebaseApp = inject(FIREBASE_APP);
  private storage: FirebaseStorage | null = null;

  public async getRecipes(): Promise<DocumentFile[]> {
    return this.firbaseService.httpGet<DocumentFile[]>('storage-getRecipes');
  }

  public saveRecipe(
    file: File,
    recipe: Recipe,
    uids: string[],
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
  ): ResumableUpload {
    return this.startUpload(file, 'recipe', {
      ...toRecipeReceiverFields(uids),
      recipe,
      onProgress,
    });
  }

  public updateRecipeAndFile(
    recipe: Recipe,
    uids: string[],
    fileId: string,
    file: File,
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
  ): ResumableUpload {
    return this.startUpload(file, 'recipe', {
      ...toRecipeReceiverFields(uids),
      recipe,
      onProgress,
      fileId,
    });
  }

  public uploadServiceImage(
    file: File,
    serviceId: string,
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
  ): ResumableUpload {
    return this.startUpload(file, 'service', { fileId: serviceId, onProgress });
  }

  public saveExercise(
    file: File,
    exercise: ExerciseTemplate,
    fileId?: string,
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
  ): ResumableUpload {
    return this.startUpload(file, 'exercise', { exercise, onProgress, fileId });
  }

  public uploadHeroImage(
    file: File,
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
  ): ResumableUpload {
    return this.startUpload(file, 'hero', { onProgress });
  }

  public uploadSiteImage(
    file: File,
    slot: string,
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
  ): ResumableUpload {
    return this.startUpload(file, 'site', { fileId: slot, onProgress });
  }

  public async getSiteImages(): Promise<DocumentFile[]> {
    return this.firbaseService.httpGetPublic<DocumentFile[]>('storage-getSiteImages');
  }

  public async deleteSiteImage(id: string): Promise<void> {
    await this.firbaseService.httpPost<{ id: string }, void>('storage-deleteSiteImage', { id });
  }

  public async getHeroImages(): Promise<DocumentFile[]> {
    return this.firbaseService.httpGetPublic<DocumentFile[]>('storage-getHeroImages');
  }

  public async deleteHeroImage(id: string): Promise<void> {
    await this.firbaseService.httpPost<{ id: string }, void>('storage-deleteHeroImage', { id });
  }

  public async reorderHeroImages(ids: string[]): Promise<void> {
    await this.firbaseService.httpPost<{ ids: string[] }, void>('storage-reorderHeroImages', {
      ids,
    });
  }

  public async updateRecipe(file: DocumentFile): Promise<void> {
    await this.firbaseService.httpPost<DocumentFile, void>('storage-editRecipe', file);
  }

  public async deleteRecipe(id: string): Promise<void> {
    await this.firbaseService.httpPost<{ id: string }, void>('storage-deleteRecipe', { id });
  }

  public async getReviews(): Promise<DocumentFile[]> {
    return this.firbaseService.httpGetPublic<DocumentFile[]>('storage-getReviews');
  }

  public saveReview(
    file: File,
    review: Review,
    uid: string,
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
  ): ResumableUpload {
    return this.startUpload(file, 'review', { uid, review, onProgress });
  }

  private startUpload(
    file: File,
    fileType: FileType,
    options: {
      uid?: string;
      recipeUids?: string[];
      recipe?: Recipe;
      review?: Review;
      exercise?: ExerciseTemplate;
      onProgress?: (snapshot: UploadTaskSnapshot) => void;
      fileId?: string;
    } = {},
  ): ResumableUpload {
    let uploadTask: UploadTask | null = null;

    const promise = this.firbaseService
      .httpPost<CreateUploadIntentInput, CreateUploadIntentReturn>('storage-createUploadIntent', {
        fileName: file.name,
        sizeBytes: file.size,
        fileType,
        ...(options.uid ? { uid: options.uid } : {}),
        ...(options.recipeUids ? { recipeUids: options.recipeUids } : {}),
        ...(options.recipe ? { recipe: options.recipe } : {}),
        ...(options.review ? { review: options.review } : {}),
        ...(options.exercise ? { exercise: options.exercise } : {}),
        ...(options.fileId ? { fileId: options.fileId } : {}),
        contentType: file.type,
      })
      .then(async (uploadIntent) => {
        const storageRef = ref(this.getStorage(), uploadIntent.storagePath);

        uploadTask = uploadBytesResumable(storageRef, file, {
          contentType: file.type || undefined,
        });

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              if (!options.onProgress) {
                return;
              }

              options.onProgress(snapshot);
            },
            (error) => reject(error),
            () => resolve(),
          );
        });

        return this.firbaseService.httpPost<FinalizeUploadInput, DocumentFile>(
          'storage-finalizeUpload',
          {
            uploadIntentId: uploadIntent.uploadIntentId,
          },
        );
      });

    return {
      cancel: () => {
        uploadTask?.cancel();
      },
      promise,
    };
  }

  private getStorage(): FirebaseStorage {
    if (!this.storage) {
      this.storage = getStorage(this.firebaseApp);
    }

    return this.storage;
  }
}
