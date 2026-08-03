import type { StorageDriver } from './types';
import { LocalStorageDriver } from './local';
import { SupabaseStorageDriver } from './supabase';

export * from './types';

let driver: StorageDriver | null = null;

/** Returns the configured storage backend. Defaults to local disk so the
 * app runs out of the box; set STORAGE_DRIVER=supabase (or cloudinary,
 * once you `npm install cloudinary`) in .env for cloud storage. */
export function getStorageDriver(): StorageDriver {
  if (driver) return driver;

  const kind = process.env.STORAGE_DRIVER ?? 'local';
  let created: StorageDriver;
  switch (kind) {
    case 'cloudinary': {
      // Dynamically required since the `cloudinary` SDK isn't installed by
      // default — run `npm install cloudinary` before selecting this driver.
      const { CloudinaryStorageDriver } = require('./cloudinary');
      created = new CloudinaryStorageDriver();
      break;
    }
    case 'supabase':
      created = new SupabaseStorageDriver();
      break;
    default:
      created = new LocalStorageDriver();
  }
  driver = created;
  return created;
}
