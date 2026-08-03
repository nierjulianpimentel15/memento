import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { StorageDriver } from './types';

/**
 * Supabase Storage driver. Uploads go through the service-role client (server
 * side only — never expose this key to the browser). The bucket is expected
 * to be public-read (images are already access-controlled at the app layer
 * by group membership before a URL is ever handed out), so getUrl() returns
 * the public CDN URL directly rather than a signed URL.
 */
export class SupabaseStorageDriver implements StorageDriver {
  private client: SupabaseClient;
  private bucket: string;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Configure Supabase env vars first.'
      );
    }
    this.client = createClient(url, key, { auth: { persistSession: false } });
    this.bucket = process.env.SUPABASE_BUCKET ?? 'memento-images';
  }

  async upload(buffer: Buffer, opts: { folder: string; filename: string; mimeType: string }) {
    const key = `${opts.folder}/${opts.filename}`;
    const { error } = await this.client.storage.from(this.bucket).upload(key, buffer, {
      contentType: opts.mimeType,
      upsert: false,
    });
    if (error) {
      throw new Error(`Supabase upload failed for ${key}: ${error.message}`);
    }
    return { key, url: this.getUrl(key) };
  }

  getUrl(key: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(key);
    return data.publicUrl;
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([key]);
    if (error) throw new Error(`Supabase delete failed for ${key}: ${error.message}`);
  }
}
