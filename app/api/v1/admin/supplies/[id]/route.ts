import { supplySchema } from '@/lib/validation/schemas';
import { update, remove } from '@/lib/services/supply.service';
import { ok, noContent } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

export const PUT = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = supplySchema.partial().parse(await req.json());
  return ok(await update(id, body));
});

export const DELETE = withAdmin(async (_req, ctx) => {
  const { id } = await ctx.params;
  await remove(id);
  return noContent();
});
