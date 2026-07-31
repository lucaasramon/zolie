import { NextRequest } from 'next/server';
import { resetSchema } from '@/lib/validation/schemas';
import { resetPassword } from '@/lib/services/auth.service';
import { ok } from '@/lib/http/envelope';
import { handleRouteError } from '@/lib/http/errorHandler';
import { assertRateLimit } from '@/lib/http/rateLimit';

export async function POST(req: NextRequest) {
  try {
    assertRateLimit(req, 'auth:reset-password', { windowMs: 15 * 60_000, max: 5 });
    const body = resetSchema.parse(await req.json());
    return ok(await resetPassword(body));
  } catch (err) {
    return handleRouteError(err);
  }
}
