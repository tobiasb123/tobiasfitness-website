import { UploadTaskSnapshot } from 'firebase/storage';

export function uploadPercentage(snapshot: UploadTaskSnapshot): number | null {
  return snapshot.totalBytes > 0
    ? Math.min(100, Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100))
    : null;
}
