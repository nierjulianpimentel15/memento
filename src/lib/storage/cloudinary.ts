import type { StorageDriver } from './types';

/**
 * Cloudinary-backed storage driver.
 *
 * NOTE: This is a working implementation shape, but it isn't wired to a live
 * account in this scaffold — you'll need to `npm install cloudinary`, set
 * CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in .env,
 * and uncomment the SDK calls below. It's kept separate from LocalStorageDriver
 * so swapping STORAGE_DRIVER=cloudinary in .env is the only change needed
 * elsewhere in the app (routes/services only depend on the StorageDriver interface).
 */
export class CloudinaryStorageDriver implements StorageDriver {
  constructor() {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error(
        'CLOUDINARY_CLOUD_NAME is not set. Configure Cloudinary env vars before selecting this driver.'
      );
    }
  }

  async upload(
    _buffer: Buffer,
    _opts: { folder: string; filename: string; mimeType: string }
  ): ReturnType<StorageDriver['upload']> {
    throw new Error(
      'CloudinaryStorageDriver.upload is a stub. Install the `cloudinary` package and implement the ' +
        'v2.uploader.upload_stream call here, returning { key: public_id, url: secure_url }.'
    );
  }

  getUrl(key: string): string {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    return `https://res.cloudinary.com/${cloud}/image/upload/${key}`;
  }

  async delete(_key: string): Promise<void> {
    throw new Error('CloudinaryStorageDriver.delete is a stub — implement v2.uploader.destroy(key).');
  }
}
