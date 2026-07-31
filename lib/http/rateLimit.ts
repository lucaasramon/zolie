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
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
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
