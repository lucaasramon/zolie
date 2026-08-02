import * as orderService from '@/lib/services/order.service';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';
import { adminCancelSchema } from '@/lib/validation/schemas';

/**
 * Cancelamento pelo admin. Diferente do fluxo do cliente, aqui é possível cancelar
 * um pedido já pago e decidir explicitamente se o valor volta para o cliente —
 * um cancelamento logístico (reenvio, troca) não estorna.
 */
export const POST = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const { motivo, estornar } = adminCancelSchema.parse(body);

  return ok(await orderService.cancelar(id, { porAdmin: true, motivo, estornar }));
});
