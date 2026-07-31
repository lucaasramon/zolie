import * as cartService from '@/lib/services/cart.service';
import { ok } from '@/lib/http/envelope';
import { withOptionalAuth } from '@/lib/http/withAuth';
import { resolveCartOwner, withGuestCartCookie } from '@/lib/http/cartOwner';

export const GET = withOptionalAuth(async (req, _ctx, user) => {
  const { owner, newSessionId } = resolveCartOwner(req, user);
  const sp = req.nextUrl.searchParams;
  const data = await cartService.get(owner, { cep: sp.get('cep') ?? undefined, cupom: sp.get('cupom') ?? undefined });
  return withGuestCartCookie(ok(data), newSessionId);
});
