import { addressSchema } from '@/lib/validation/schemas';
import { addressRepo } from '@/lib/repositories/address.repo';
import { ok, created } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

export const GET = withAuth(async (_req, _ctx, user) => ok(await addressRepo.listByUser(user.sub)));

export const POST = withAuth(async (req, _ctx, user) => {
  const body = addressSchema.parse(await req.json());
  return created(await addressRepo.create(user.sub, body));
});
