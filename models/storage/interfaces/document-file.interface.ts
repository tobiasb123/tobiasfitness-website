import { fileType } from './fileType.interface';

export interface DocumentFile {
  id: number;
  fileType: fileType;
  fileName: string;
  filePath: string;
  fileUrl: string;
  timeCreated: string;
  discription?: string;
  order?: number;
  uid?: string;
  recipe?: Recipe;
}

export interface Recipe {
  image: string;
  ingredients: string[];
  instructions: string[];
  macros: string[];
}
