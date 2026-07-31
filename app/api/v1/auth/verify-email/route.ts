import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyEmail } from '@/lib/services/auth.service';
import { ok } from '@/lib/http/envelope';
import { handleRouteError } from '@/lib/http/errorHandler';
import { assertRateLimit } from '@/lib/http/rateLimit';

const verifySchema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    assertRateLimit(req, 'auth:verify-email', { windowMs: 60_000, max: 10 });
    const { token } = verifySchema.parse(await req.json());
    return ok(await verifyEmail(token));
  } catch (err) {
    return handleRouteError(err);
  }
}
