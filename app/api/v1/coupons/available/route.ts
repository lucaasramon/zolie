import * as coupons from '@/lib/services/coupon.service';
import { ok } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

export const GET = withAuth(async (_req, _ctx, user) => {
  const disponiveis = await coupons.listarDisponiveis(user.sub);
  return ok(
    disponiveis.map(c => ({
      codigo: c.codigo,
      descricao: c.descricao,
      tipoDesconto: c.tipoDesconto,
      valor: Number(c.valor),
      minimoPedido: c.minimoPedido != null ? Number(c.minimoPedido) : null,
      validade: c.validade ? c.validade.toISOString() : null,
    })),
  );
});
