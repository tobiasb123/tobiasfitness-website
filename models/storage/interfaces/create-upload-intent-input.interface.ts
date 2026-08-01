import { FileType } from '../types/file-type.type';
import { Recipe } from './recipe.interface';
import { Review } from './review.interface';

export interface CreateUploadIntentInput {
  fileName: string;
  sizeBytes: number;
  fileType: FileType;
  uid?: string;
  fileId?: string;
  recipe?: Recipe;
  review?: Review;
  contentType?: string;
  folderPath?: string;
}
