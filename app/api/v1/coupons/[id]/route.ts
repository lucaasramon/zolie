import { couponSchema } from '@/lib/validation/schemas';
import { couponRepo } from '@/lib/repositories/coupon.repo';
import { notFound } from '@/lib/utils/errors';
import { ok, noContent } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

export const PUT = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = couponSchema.partial().parse(await req.json());
  const c = await couponRepo.update(id, body).catch(() => null);
  if (!c) throw notFound('Cupom');
  return ok(c);
});

export const DELETE = withAdmin(async (_req, ctx) => {
  const { id } = await ctx.params;
  await couponRepo.remove(id);
  return noContent();
});
