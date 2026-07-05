import { inject, Injectable } from '@angular/core';
import { DocumentFile, Recipe, UploadFile } from '@models/storage';
import { FirebaseService } from '@modules/firebase';

@Injectable({
  providedIn: 'root',
})
export class StorageFunctions {
  private firbaseService = inject(FirebaseService);

  public async saveRecipe(file: File, title: string, recipe: Recipe): Promise<DocumentFile> {
    const uploadFileData = await this.getUploadFileData(file, title, recipe);

    return await this.firbaseService.httpPost<UploadFile, DocumentFile>(
      'storage-saveRecipe',
      uploadFileData,
    );
  }

  public async editRecipe(document: DocumentFile): Promise<DocumentFile> {
    return this.firbaseService.httpPost<DocumentFile, DocumentFile>('storage-editRecipe', document);
  }

  public async getRecipies(): Promise<DocumentFile[]> {
    return this.firbaseService.httpGet<DocumentFile[]>('storage-getRecipies');
  }

  public async getRecipe(name: string): Promise<DocumentFile> {
    return this.firbaseService.httpGet<DocumentFile>('storage-getRecipe');
  }

  private async getUploadFileData(file: File, title: string, recipe: Recipe): Promise<UploadFile> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const bytesLen = bytes.length;
    let binary = '';

    for (let i = 0; i < bytesLen; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    const base64String = btoa(binary);

    return <UploadFile>{
      base64String,
      title,
      fileName: file.name,
      recipe,
    };
  }
}
