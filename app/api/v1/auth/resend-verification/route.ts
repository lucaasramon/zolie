import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/http/withAuth';
import { resendVerification } from '@/lib/services/auth.service';
import { ok } from '@/lib/http/envelope';
import { assertRateLimit } from '@/lib/http/rateLimit';
import { handleRouteError } from '@/lib/http/errorHandler';

export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  try {
    assertRateLimit(req, 'auth:resend-verification', { windowMs: 60_000, max: 3 });
  } catch (err) {
    return handleRouteError(err);
  }
  return ok(await resendVerification(user.sub));
});
