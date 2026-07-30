import * as wishlist from '@/lib/services/wishlist.service';
import { ok, created } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

export const POST = withAuth(async (_req, ctx, user) => {
  const { productId } = await ctx.params;
  return created(await wishlist.add(user.sub, productId));
});

export const DELETE = withAuth(async (_req, ctx, user) => {
  const { productId } = await ctx.params;
  return ok(await wishlist.remove(user.sub, productId));
});
