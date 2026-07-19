export interface CreateUploadIntentReturn {
  uploadIntentId: string;
  storagePath: string;
  maxSizeBytes: number;
  expiresAt: string;
}
