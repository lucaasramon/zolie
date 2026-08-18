import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as guestEmailVerification from '@/lib/services/guestEmailVerification.service';
import { ok } from '@/lib/http/envelope';
import { withErrorHandling } from '@/lib/http/withAuth';
import { assertRateLimit } from '@/lib/http/rateLimit';

const bodySchema = z.object({ token: z.string().min(1) });

// Chamado pela página que abre quando o convidado clica no link do e-mail.
export const POST = withErrorHandling(async (req: NextRequest) => {
  assertRateLimit(req, 'auth:guest-email-verification:confirm', { windowMs: 60_000, max: 10 });
  const { token } = bodySchema.parse(await req.json());
  return ok(await guestEmailVerification.confirmar(token));
});
