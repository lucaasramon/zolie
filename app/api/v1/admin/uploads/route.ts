import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';
import { AppError } from '@/lib/utils/errors';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_SIZE = 5 * 1024 * 1024;

export const POST = withAdmin(async req => {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw new AppError('Arquivo não enviado', 400, 'BAD_REQUEST');

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new AppError('Formato inválido. Use JPG, PNG ou WEBP.', 400, 'INVALID_FILE_TYPE');
  if (file.size > MAX_SIZE) throw new AppError('Arquivo muito grande. Máximo de 5MB.', 400, 'FILE_TOO_LARGE');

  const dir = path.join(process.cwd(), 'public', 'images', 'produtos');
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return ok({ url: `/images/produtos/${filename}` });
});
