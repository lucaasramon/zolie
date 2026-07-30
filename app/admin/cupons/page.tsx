import { couponRepo } from '@/lib/repositories/coupon.repo';
import { CouponManager } from '@/components/admin/CouponManager';

export const dynamic = 'force-dynamic';

export default async function AdminCuponsPage() {
  const coupons = await couponRepo.list();
  const serialized = coupons.map(c => ({
    ...c,
    valor: Number(c.valor),
    minimoPedido: c.minimoPedido != null ? Number(c.minimoPedido) : null,
    validade: c.validade ? c.validade.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  }));
  return <CouponManager coupons={serialized} />;
}
