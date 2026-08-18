import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as guestOrderAccess from '@/lib/services/guestOrderAccess.service';
import { ok } from '@/lib/http/envelope';
import { withErrorHandling } from '@/lib/http/withAuth';
import { assertRateLimit } from '@/lib/http/rateLimit';

const querySchema = z.object({ token: z.string().trim().min(1) });

export const GET = withErrorHandling(async (req: NextRequest, ctx) => {
  assertRateLimit(req, 'orders:publico-detalhe', { windowMs: 60_000, max: 30 });
  const { id } = await ctx.params;
  const { token } = querySchema.parse({ token: req.nextUrl.searchParams.get('token') ?? '' });
  return ok(await guestOrderAccess.detalhe(token, id));
});
