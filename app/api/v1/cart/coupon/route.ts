import { couponCodeSchema } from '@/lib/validation/schemas';
import * as cartService from '@/lib/services/cart.service';
import * as coupons from '@/lib/services/coupon.service';
import { ok } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

export const POST = withAuth(async (req, _ctx, user) => {
  const { codigo } = couponCodeSchema.parse(await req.json());
  const cart = await cartService.get(user.sub);
  const r = await coupons.validar(codigo, { subtotal: cart.resumo.subtotal, userId: user.sub });
  return ok({ codigo: r.cupom.codigo, descricao: r.cupom.descricao, desconto: r.desconto, freteGratis: r.freteGratis });
});
