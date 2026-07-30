import { quantitySchema } from '@/lib/validation/schemas';
import * as cartService from '@/lib/services/cart.service';
import { ok } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

export const PATCH = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const { quantidade } = quantitySchema.parse(await req.json());
  return ok(await cartService.updateItem(user.sub, id, quantidade));
});

export const DELETE = withAuth(async (_req, ctx, user) => {
  const { id } = await ctx.params;
  return ok(await cartService.removeItem(user.sub, id));
});
