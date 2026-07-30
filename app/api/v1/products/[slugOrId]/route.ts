import { productSchema } from '@/lib/validation/schemas';
import { bySlug, update, remove } from '@/lib/services/product.service';
import { ok, noContent } from '@/lib/http/envelope';
import { withAdmin, withErrorHandling } from '@/lib/http/withAuth';

export const GET = withErrorHandling(async (_req, ctx) => {
  const { slugOrId } = await ctx.params;
  return ok(await bySlug(slugOrId));
});

export const PUT = withAdmin(async (req, ctx) => {
  const { slugOrId } = await ctx.params;
  const body = productSchema.partial().parse(await req.json());
  return ok(await update(slugOrId, body));
});

export const DELETE = withAdmin(async (_req, ctx) => {
  const { slugOrId } = await ctx.params;
  await remove(slugOrId);
  return noContent();
});
