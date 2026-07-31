import { couponRepo } from '@/lib/repositories/coupon.repo';
import { ok } from '@/lib/http/envelope';
import { withErrorHandling } from '@/lib/http/withAuth';

export const GET = withErrorHandling(async () => {
  const cupom = await couponRepo.findActiveWelcomeCoupon();
  if (!cupom) return ok({ cupom: null });
  return ok({
    cupom: {
      codigo: cupom.codigo,
      descricao: cupom.descricao,
      tipoDesconto: cupom.tipoDesconto,
      valor: Number(cupom.valor),
    },
  });
});
