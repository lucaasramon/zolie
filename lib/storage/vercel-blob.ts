import { put } from '@vercel/blob';
import type { StorageProvider } from './index';

export const vercelBlobStorageProvider: StorageProvider = {
  async save(filename, bytes) {
    const blob = await put(filename, bytes, { access: 'public', addRandomSuffix: false });
    return { url: blob.url };
  },
};
