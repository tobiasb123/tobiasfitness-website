import { inject, Injectable } from '@angular/core';
import { DocumentFile } from '@models/storage';
import { FirebaseService } from '@modules/firebase';

@Injectable({
  providedIn: 'root',
})
export class StorageFunctions {
  private firbaseService = inject(FirebaseService);

  public async saveRecipe(document: DocumentFile): Promise<void> {
    return this.firbaseService.httpPost<DocumentFile, void>('storage-saveRecipe', document);
  }
}
