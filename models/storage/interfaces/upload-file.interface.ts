import { Recipe } from './recipe.interface';

export interface UploadFile {
  base64String: string;
  title: string;
  fileName: string;
  recipe: Recipe;
}
