import { FileType, Recipe } from '@models/storage';
import { Timestamp } from 'firebase-admin/firestore';

export interface UploadIntentDocument {
  uid: string;
  status: 'pending' | 'finalized';
  fileName: string;
  fileType: FileType;
  folderPath: string;
  recipe?: Recipe;
  title?: string;
  reviewText?: string;
  contentType?: string;
  sizeBytes: number;
  maxSizeBytes: number;
  storagePath: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  finalizedAt?: Timestamp;
  finalizedFileId?: string;
}
