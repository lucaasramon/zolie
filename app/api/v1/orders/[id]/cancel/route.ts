import * as orderService from '@/lib/services/order.service';
import { ok } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';
import { cancelSchema } from '@/lib/validation/schemas';

/**
 * Cancelamento pelo próprio cliente. Só permitido enquanto o pedido não foi pago
 * — depois disso o cancelamento passa pelo admin, para não disparar estorno sem revisão.
 */
export const POST = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const { motivo } = cancelSchema.parse(body);

  return ok(await orderService.cancelar(id, { userId: user.sub, motivo }));
});
