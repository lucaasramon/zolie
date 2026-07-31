import { randomUUID } from 'crypto';
import { ok } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';
import { AppError } from '@/lib/utils/errors';
import { detectImageMime } from '@/lib/utils/fileSignature';
import { storage } from '@/lib/storage';
import { assertRateLimit } from '@/lib/http/rateLimit';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_SIZE = 5 * 1024 * 1024;

export const POST = withAuth(async (req) => {
  assertRateLimit(req, 'reviews:uploads', { windowMs: 60_000, max: 10 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw new AppError('Arquivo não enviado', 400, 'BAD_REQUEST');
  if (file.size > MAX_SIZE) throw new AppError('Arquivo muito grande. Máximo de 5MB.', 400, 'FILE_TOO_LARGE');

  const bytes = Buffer.from(await file.arrayBuffer());
  const detectedMime = detectImageMime(bytes);
  const ext = detectedMime ? EXT_BY_MIME[detectedMime] : null;
  if (!ext) throw new AppError('Formato inválido. Use JPG, PNG ou WEBP.', 400, 'INVALID_FILE_TYPE');

  const filename = `review-${randomUUID()}.${ext}`;
  const { url } = await storage.save(filename, bytes);

  return ok({ url });
});
