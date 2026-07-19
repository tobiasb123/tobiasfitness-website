import { FileType } from '../types/file-type.type';
import { Recipe } from './recipe.interface';

export interface CreateUploadIntentInput {
  fileName: string;
  sizeBytes: number;
  fileType: FileType;
  title?: string;
  recipe?: Recipe;
  reviewText?: string;
  contentType?: string;
  folderPath?: string;
}
