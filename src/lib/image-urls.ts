import { getStorageDriver } from '@/lib/storage';

export interface ImageUrls {
  originalUrl: string;
  webUrl: string;
  thumbnailUrl: string;
}

/**
 * Image records store storage-driver-specific *keys* (a path for local disk,
 * an object key for Supabase/Cloudinary) — not the final URL, since the
 * driver can be swapped. This resolves those keys into real, loadable URLs
 * right before a response goes to the client, so the frontend never has to
 * guess which driver produced the key.
 */
export function withImageUrls<T extends { storageKey: string; webKey: string; thumbnailKey: string }>(
  image: T
): T & ImageUrls {
  const storage = getStorageDriver();
  return {
    ...image,
    originalUrl: storage.getUrl(image.storageKey),
    webUrl: storage.getUrl(image.webKey),
    thumbnailUrl: storage.getUrl(image.thumbnailKey),
  };
}

export function withImageUrlsList<T extends { storageKey: string; webKey: string; thumbnailKey: string }>(
  images: T[]
): (T & ImageUrls)[] {
  return images.map(withImageUrls);
}
