import sharp from 'sharp';

export interface ProcessedImage {
  original: Buffer;
  web: Buffer; // resized + compressed, for feed/lightbox display
  thumbnail: Buffer; // small square-ish crop for gallery grid
  width: number;
  height: number;
}

const WEB_MAX_DIMENSION = 1920;
const THUMB_MAX_DIMENSION = 480;

/**
 * Reject anything that isn't a real, decodable image (basic file validation
 * per the security requirements — this is not virus scanning, just a sanity
 * check that Sharp can parse the bytes as image data before we persist them).
 */
export async function processUpload(buffer: Buffer): Promise<ProcessedImage> {
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new Error('Unsupported or corrupt image file.');
  }

  const allowedFormats = new Set(['jpeg', 'png', 'webp', 'heif', 'avif']);
  if (!allowedFormats.has(metadata.format)) {
    throw new Error(`Unsupported image format: ${metadata.format}`);
  }

  const web = await sharp(buffer)
    .rotate() // apply EXIF orientation
    .resize({ width: WEB_MAX_DIMENSION, height: WEB_MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const thumbnail = await sharp(buffer)
    .rotate()
    .resize({ width: THUMB_MAX_DIMENSION, height: THUMB_MAX_DIMENSION, fit: 'cover' })
    .webp({ quality: 70 })
    .toBuffer();

  return {
    original: buffer,
    web,
    thumbnail,
    width: metadata.width,
    height: metadata.height,
  };
}

export const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB per image
