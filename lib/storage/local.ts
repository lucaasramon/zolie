import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import type { StorageProvider } from './index';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'produtos');

export const localStorageProvider: StorageProvider = {
  async save(filename, bytes) {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), bytes);
    return { url: `/images/produtos/${filename}` };
  },
};
