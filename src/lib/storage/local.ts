import { promises as fs } from 'fs';
import path from 'path';
import type { StorageDriver } from './types';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');

export class LocalStorageDriver implements StorageDriver {
  async upload(buffer: Buffer, opts: { folder: string; filename: string; mimeType: string }) {
    const dir = path.join(UPLOAD_ROOT, opts.folder);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, opts.filename);
    await fs.writeFile(filePath, buffer);
    const key = path.posix.join(opts.folder, opts.filename);
    return { key, url: this.getUrl(key) };
  }

  getUrl(key: string): string {
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(UPLOAD_ROOT, key);
    await fs.rm(filePath, { force: true });
  }
}
