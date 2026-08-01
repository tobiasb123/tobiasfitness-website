import { HttpsError } from 'firebase-functions/https';

export const commonNormalizeFileName = (fileName: string): string => {
  const normalizedFileName = fileName.trim();

  if (!normalizedFileName) {
    throw new HttpsError('invalid-argument', 'Filnavn er påkrævet');
  }

  if (
    normalizedFileName.includes('/') ||
    normalizedFileName.includes('\\') ||
    normalizedFileName === '.' ||
    normalizedFileName === '..'
  ) {
    throw new HttpsError('invalid-argument', 'Ugyldigt filnavn');
  }

  return normalizedFileName;
};

export const commonValidateIntentContentType = (contentType?: string): string => {
  if (!contentType) {
    return undefined;
  }

  const normalizedContentType = contentType.trim().toLowerCase();

  if (!normalizedContentType) {
    return undefined;
  }

  if (!normalizedContentType.startsWith('image/')) {
    throw new HttpsError('invalid-argument', 'Filen skal være et billede');
  }

  return normalizedContentType;
};
