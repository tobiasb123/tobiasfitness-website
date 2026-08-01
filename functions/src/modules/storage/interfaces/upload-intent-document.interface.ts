import { FileType, Recipe, Review } from '@models/storage';
import { Timestamp } from 'firebase-admin/firestore';

export interface UploadIntentDocument {
  uid: string;
  recipeUid?: string;
  status: 'pending' | 'finalized';
  fileName: string;
  fileType: FileType;
  folderPath: string;
  fileId?: string;
  recipe?: Recipe;
  review?: Review;
  contentType?: string;
  sizeBytes: number;
  maxSizeBytes: number;
  storagePath: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  finalizedAt?: Timestamp;
  finalStoragePath?: string;
  finalizedFileId?: string;
}
