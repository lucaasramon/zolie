export interface StorageProvider {
  save(filename: string, bytes: Buffer): Promise<{ url: string }>;
}

import { localStorageProvider } from './local';
import { vercelBlobStorageProvider } from './vercel-blob';

// Local só funciona em dev (filesystem read-only na Vercel em produção).
export const storage: StorageProvider = process.env.BLOB_READ_WRITE_TOKEN
  ? vercelBlobStorageProvider
  : localStorageProvider;
