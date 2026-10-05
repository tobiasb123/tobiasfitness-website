import { FileType } from '@models/storage';

export const commonGetFileTypePath = (
  fileType: FileType,
): 'recipes' | 'reviews' | 'service-images' => {
  switch (fileType) {
    case 'recipe':
      return 'recipes';
    case 'review':
      return 'reviews';
    case 'service':
      return 'service-images';
  }
};

export const commonGetFileNameFromPath = (filePath: string, fileType: FileType): string => {
  const rootPath = `${commonGetFileTypePath(fileType)}/`;
  const relativePath = filePath.slice(rootPath.length);
  const pathSegments = relativePath.split('/');

  return pathSegments[pathSegments.length - 1] ?? relativePath;
};
