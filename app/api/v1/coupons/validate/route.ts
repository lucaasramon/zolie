import { couponCodeSchema } from '@/lib/validation/schemas';
import * as coupons from '@/lib/services/coupon.service';
import { ok } from '@/lib/http/envelope';
import { withOptionalAuth } from '@/lib/http/withAuth';

export const POST = withOptionalAuth(async (req, _ctx, user) => {
  const { codigo, subtotal } = couponCodeSchema.parse(await req.json());
  const r = await coupons.validar(codigo, { subtotal: Number(subtotal || 0), userId: user?.sub ?? null });
  return ok({ codigo: r.cupom.codigo, descricao: r.cupom.descricao, desconto: r.desconto, freteGratis: r.freteGratis });
});
