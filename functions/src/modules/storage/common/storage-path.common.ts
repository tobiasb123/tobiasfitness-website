import { FileType } from '@models/storage';

export const commonGetFileTypePath = (fileType: FileType): 'recipes' | 'reviews' => {
  switch (fileType) {
    case 'recipe':
      return 'recipes';
    case 'review':
      return 'reviews';
  }
};

export const commonGetFileNameFromPath = (filePath: string, fileType: FileType): string => {
  const rootPath = `${commonGetFileTypePath(fileType)}/`;
  return filePath.slice(rootPath.length);
};
