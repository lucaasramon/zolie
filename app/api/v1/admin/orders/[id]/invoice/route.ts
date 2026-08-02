import { orderRepo } from '@/lib/repositories/order.repo';
import { notaFiscalSchema } from '@/lib/validation/schemas';
import { notFound } from '@/lib/utils/errors';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

/** Anexa os dados da NF-e ao pedido. A emissão acontece fora do sistema. */
export const PATCH = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  const dados = notaFiscalSchema.parse(await req.json());

  const order = await orderRepo.findById(id);
  if (!order) throw notFound('Pedido');

  return ok(await orderRepo.setNotaFiscal(id, dados));
});
