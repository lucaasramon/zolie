import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as guestOrderAccess from '@/lib/services/guestOrderAccess.service';
import { parsePagination, meta } from '@/lib/utils/pagination';
import { ok } from '@/lib/http/envelope';
import { withErrorHandling } from '@/lib/http/withAuth';
import { assertRateLimit } from '@/lib/http/rateLimit';

const querySchema = z.object({ token: z.string().trim().min(1) });

// Lista os pedidos de um convidado (sem conta) pelo token recebido no e-mail de
// confirmação — substitui o login para quem comprou sem criar conta.
export const GET = withErrorHandling(async (req: NextRequest) => {
  assertRateLimit(req, 'orders:publico-listar', { windowMs: 60_000, max: 30 });
  const { token } = querySchema.parse({ token: req.nextUrl.searchParams.get('token') ?? '' });
  const sp = req.nextUrl.searchParams;
  const pagination = parsePagination({ page: sp.get('page') ?? undefined, perPage: sp.get('perPage') ?? undefined });
  const { total, items } = await guestOrderAccess.listar(token, pagination);
  return ok(items, meta(total, pagination));
});
