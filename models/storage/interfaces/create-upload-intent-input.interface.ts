import { FileType } from '../types/file-type.type';
import { ExerciseTemplate } from './exercise.interface';
import { Recipe } from './recipe.interface';
import { Review } from './review.interface';

export interface CreateUploadIntentInput {
  fileName: string;
  sizeBytes: number;
  fileType: FileType;
  uid?: string;
  recipeUids?: string[];
  fileId?: string;
  recipe?: Recipe;
  review?: Review;
  exercise?: ExerciseTemplate;
  contentType?: string;
  folderPath?: string;
}
