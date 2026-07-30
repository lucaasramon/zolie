import { couponSchema } from '@/lib/validation/schemas';
import { couponRepo } from '@/lib/repositories/coupon.repo';
import { ok, created } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

export const GET = withAdmin(async () => ok(await couponRepo.list()));

export const POST = withAdmin(async req => {
  const body = couponSchema.parse(await req.json());
  return created(await couponRepo.create(body));
});
