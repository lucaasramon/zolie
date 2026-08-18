import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as guestOrderAccess from '@/lib/services/guestOrderAccess.service';
import { ok } from '@/lib/http/envelope';
import { withErrorHandling } from '@/lib/http/withAuth';
import { assertRateLimit } from '@/lib/http/rateLimit';
import { cancelSchema } from '@/lib/validation/schemas';

const querySchema = z.object({ token: z.string().trim().min(1) });

export const POST = withErrorHandling(async (req: NextRequest, ctx) => {
  assertRateLimit(req, 'orders:publico-cancel', { windowMs: 60_000, max: 10 });
  const { id } = await ctx.params;
  const { token } = querySchema.parse({ token: req.nextUrl.searchParams.get('token') ?? '' });
  const body = await req.json().catch(() => ({}));
  const { motivo } = cancelSchema.parse(body);
  return ok(await guestOrderAccess.cancelar(token, id, motivo));
});
