import { inject, Injectable } from '@angular/core';
import {
  CreateUploadIntentInput,
  CreateUploadIntentReturn,
  DocumentFile,
  FinalizeUploadInput,
  Recipe,
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

export interface ResumableRecipeUpload {
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

  public async saveRecipe(
    file: File,
    title: string,
    recipe: Recipe,
    uid: string,
  ): Promise<DocumentFile> {
    return this.startSaveRecipeUpload(file, title, recipe, uid).promise;
  }

  public startSaveRecipeUpload(
    file: File,
    title: string,
    recipe: Recipe,
    uid: string,
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
  ): ResumableRecipeUpload {
    return this.startRecipeUpload(file, title, recipe, uid, onProgress);
  }

  public async replaceRecipeFile(
    file: File,
    fileId: string,
    title: string,
    recipe: Recipe,
    uid: string,
  ): Promise<DocumentFile> {
    return this.startReplaceRecipeFileUpload(file, fileId, title, recipe, uid).promise;
  }

  public startReplaceRecipeFileUpload(
    file: File,
    fileId: string,
    title: string,
    recipe: Recipe,
    uid: string,
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
  ): ResumableRecipeUpload {
    return this.startRecipeUpload(file, title, recipe, uid, onProgress, fileId);
  }

  public async editRecipe(document: DocumentFile): Promise<void> {
    await this.firbaseService.httpPost<DocumentFile, void>('storage-editRecipe', document);
  }

  public async getRecipies(): Promise<DocumentFile[]> {
    return this.firbaseService.httpGet<DocumentFile[]>('storage-getRecipies');
  }

  public async getRecipe(name: string): Promise<DocumentFile> {
    return this.firbaseService.httpGet<DocumentFile>('storage-getRecipe');
  }

  private startRecipeUpload(
    file: File,
    title: string,
    recipe: Recipe,
    uid: string,
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
    fileId?: string,
  ): ResumableRecipeUpload {
    let uploadTask: UploadTask | null = null;

    const promise = this.firbaseService
      .httpPost<CreateUploadIntentInput, CreateUploadIntentReturn>('storage-createUploadIntent', {
        title,
        fileName: file.name,
        sizeBytes: file.size,
        fileType: 'recipe',
        uid,
        recipe,
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
