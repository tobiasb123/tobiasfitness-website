import { FileType } from '../types/file-type.type';
import { Recipe } from './recipe.interface';

export interface CreateUploadIntentInput {
  fileName: string;
  sizeBytes: number;
  fileType: FileType;
  uid?: string;
  fileId?: string;
  title?: string;
  recipe?: Recipe;
  reviewText?: string;
  contentType?: string;
  folderPath?: string;
}
