import { NextRequest } from 'next/server';
import { tooManyRequests } from '@/lib/utils/errors';

interface Bucket {
  count: number;
  resetAt: number;
}

// Limitador em memória por processo. Suficiente para uma única instância;
// em deploy multi-instância, trocar por um store compartilhado (ex: Redis/Upstash).
const buckets = new Map<string, Bucket>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref?.();

function clientKey(req: NextRequest): string {
  // Na Vercel, o proxy de borda ANEXA o IP real do cliente ao final do
  // X-Forwarded-For em vez de substituí-lo — as entradas anteriores podem
  // ser controladas pelo próprio cliente. Por isso usamos a ÚLTIMA entrada
  // (valor de confiança) em vez da primeira, que é facilmente falsificável
  // e permitiria burlar o rate limit variando o header a cada requisição.
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function assertRateLimit(req: NextRequest, scope: string, { windowMs, max }: { windowMs: number; max: number }) {
  const key = `${scope}:${clientKey(req)}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (bucket.count >= max) {
    throw tooManyRequests();
  }

  bucket.count += 1;
}
