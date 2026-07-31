export interface StorageProvider {
  save(filename: string, bytes: Buffer): Promise<{ url: string }>;
}

import { localStorageProvider } from './local';

// Troque por um provider de S3/R2 implementando a mesma interface
// (ex: STORAGE_PROVIDER=s3 -> retorna s3StorageProvider) sem alterar quem consome `storage`.
export const storage: StorageProvider = localStorageProvider;
