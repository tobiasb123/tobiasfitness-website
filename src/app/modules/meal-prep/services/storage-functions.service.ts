import { inject, Injectable } from '@angular/core';
import {
  CreateUploadIntentInput,
  CreateUploadIntentReturn,
  DocumentFile,
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
    uid: string,
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
  ): ResumableUpload {
    return this.startUpload(file, uid, recipe, null, onProgress);
  }

  public updateRecipeAndFile(
    recipe: Recipe,
    uid: string,
    fileId: string,
    file: File,
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
  ): ResumableUpload {
    return this.startUpload(file, uid, recipe, null, onProgress, fileId);
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
    return this.startUpload(file, uid, null, review, onProgress);
  }

  private startUpload(
    file: File,
    uid: string,
    recipe?: Recipe,
    review?: Review,
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
    fileId?: string,
  ): ResumableUpload {
    let uploadTask: UploadTask | null = null;
    const fileType: FileType = review ? 'review' : 'recipe';

    const promise = this.firbaseService
      .httpPost<CreateUploadIntentInput, CreateUploadIntentReturn>('storage-createUploadIntent', {
        fileName: file.name,
        sizeBytes: file.size,
        fileType,
        uid,
        recipe,
        review,
        fileId,
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
              if (!onProgress) {
                return;
              }

              onProgress(snapshot);
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
