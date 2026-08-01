import { FileType } from '../types/file-type.type';
import { Recipe } from './recipe.interface';
import { Review } from './review.interface';

export interface DocumentFile {
  id: string;
  uid: string;
  filePath: string;
  fileType: FileType;
  fileName: string;
  folderPath: string;
  fileUrl: string;
  timeCreated: string;
  recipe?: Recipe;
  review?: Review;
}
