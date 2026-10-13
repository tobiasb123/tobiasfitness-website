import { DocumentFile } from '@models/storage';

export function getRecipeReceiverUids(document: Pick<DocumentFile, 'uid' | 'recipeUids'>): string[] {
  if (document.recipeUids?.length) {
    return document.recipeUids;
  }

  return [document.uid || 'all'];
}

export function isRecipeForUser(
  document: Pick<DocumentFile, 'uid' | 'recipeUids'>,
  userUid: string,
): boolean {
  return getRecipeReceiverUids(document).includes(userUid);
}

export function toRecipeReceiverFields(uids: string[]): Pick<DocumentFile, 'uid' | 'recipeUids'> {
  if (!uids.length || uids.includes('all')) {
    return { uid: 'all' };
  }

  return { uid: uids[0], recipeUids: uids };
}
