import * as cartService from '@/lib/services/cart.service';
import { ok } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

export const GET = withAuth(async (req, _ctx, user) => {
  const sp = req.nextUrl.searchParams;
  return ok(await cartService.get(user.sub, { cep: sp.get('cep') ?? undefined, cupom: sp.get('cupom') ?? undefined }));
});
