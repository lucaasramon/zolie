import { profileSchema } from '@/lib/validation/schemas';
import { me, updateProfile } from '@/lib/services/auth.service';
import { ok } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

export const GET = withAuth(async (_req, _ctx, user) => ok(await me(user.sub)));

export const PUT = withAuth(async (req, _ctx, user) => {
  const body = profileSchema.parse(await req.json());
  return ok(await updateProfile(user.sub, body));
});
