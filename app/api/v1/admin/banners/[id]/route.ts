import { bannerSchema } from '@/lib/validation/schemas';
import * as bannerService from '@/lib/services/banner.service';
import { ok, noContent } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

export const PUT = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = bannerSchema.partial().parse(await req.json());
  return ok(await bannerService.update(id, body));
});

export const DELETE = withAdmin(async (_req, ctx) => {
  const { id } = await ctx.params;
  await bannerService.remove(id);
  return noContent();
});
