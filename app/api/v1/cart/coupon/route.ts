import { couponCodeSchema } from '@/lib/validation/schemas';
import * as cartService from '@/lib/services/cart.service';
import * as coupons from '@/lib/services/coupon.service';
import { ok } from '@/lib/http/envelope';
import { withOptionalAuth } from '@/lib/http/withAuth';
import { resolveCartOwner, withGuestCartCookie } from '@/lib/http/cartOwner';

export const POST = withOptionalAuth(async (req, _ctx, user) => {
  const { owner, newSessionId } = resolveCartOwner(req, user);
  const { codigo } = couponCodeSchema.parse(await req.json());
  const cart = await cartService.get(owner);
  const r = await coupons.validar(codigo, { subtotal: cart.resumo.subtotal, userId: user?.sub ?? null });
  const data = { codigo: r.cupom.codigo, descricao: r.cupom.descricao, desconto: r.desconto, freteGratis: r.freteGratis };
  return withGuestCartCookie(ok(data), newSessionId);
});
