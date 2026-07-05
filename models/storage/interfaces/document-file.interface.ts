import { Recipe } from './recipe.interface';

export interface DocumentFile {
  id: string;
  uid: string;
  title: string;
  filePath: string;
  fileUrl: string;
  timeCreated: string;
  recipe: Recipe;
}
