export interface UploadResult {
  key: string;
  url: string;
}

export interface StorageDriver {
  /** Upload a buffer, returning the storage key and a publicly-usable URL. */
  upload(buffer: Buffer, opts: { folder: string; filename: string; mimeType: string }): Promise<UploadResult>;
  /** Resolve a storage key to a public/signed URL. */
  getUrl(key: string): string;
  /** Delete an object by key. */
  delete(key: string): Promise<void>;
}
