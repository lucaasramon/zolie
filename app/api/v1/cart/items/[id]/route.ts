import { quantitySchema } from '@/lib/validation/schemas';
import * as cartService from '@/lib/services/cart.service';
import { ok } from '@/lib/http/envelope';
import { withOptionalAuth } from '@/lib/http/withAuth';
import { resolveCartOwner, withGuestCartCookie } from '@/lib/http/cartOwner';

export const PATCH = withOptionalAuth(async (req, ctx, user) => {
  const { owner, newSessionId } = resolveCartOwner(req, user);
  const { id } = await ctx.params;
  const { quantidade } = quantitySchema.parse(await req.json());
  const data = await cartService.updateItem(owner, id, quantidade);
  return withGuestCartCookie(ok(data), newSessionId);
});

export const DELETE = withOptionalAuth(async (req, ctx, user) => {
  const { owner, newSessionId } = resolveCartOwner(req, user);
  const { id } = await ctx.params;
  const data = await cartService.removeItem(owner, id);
  return withGuestCartCookie(ok(data), newSessionId);
});
