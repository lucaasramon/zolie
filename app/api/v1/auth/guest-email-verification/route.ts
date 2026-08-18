import { NextRequest } from 'next/server';
import { z } from 'zod';
import { email } from '@/lib/validation/schemas';
import * as guestEmailVerification from '@/lib/services/guestEmailVerification.service';
import { ok } from '@/lib/http/envelope';
import { withErrorHandling } from '@/lib/http/withAuth';
import { assertRateLimit } from '@/lib/http/rateLimit';

const bodySchema = z.object({ email });
const querySchema = z.object({ email });

// Dispara o e-mail de confirmação para quem está comprando como convidado (sem
// conta). O checkout só libera a etapa seguinte depois que esse e-mail é
// confirmado — ver GET abaixo, usado no polling da tela.
export const POST = withErrorHandling(async (req: NextRequest) => {
  assertRateLimit(req, 'auth:guest-email-verification:send', { windowMs: 10 * 60_000, max: 5 });
  const { email } = bodySchema.parse(await req.json());
  return ok(await guestEmailVerification.enviar(email));
});

// Usado pelo checkout em polling enquanto aguarda o clique no link do e-mail.
export const GET = withErrorHandling(async (req: NextRequest) => {
  assertRateLimit(req, 'auth:guest-email-verification:status', { windowMs: 60_000, max: 60 });
  const { email } = querySchema.parse({ email: req.nextUrl.searchParams.get('email') ?? '' });
  return ok(await guestEmailVerification.status(email));
});
