import { cartItemSchema } from '@/lib/validation/schemas';
import * as cartService from '@/lib/services/cart.service';
import { created } from '@/lib/http/envelope';
import { withOptionalAuth } from '@/lib/http/withAuth';
import { resolveCartOwner, withGuestCartCookie } from '@/lib/http/cartOwner';

export const POST = withOptionalAuth(async (req, _ctx, user) => {
  const { owner, newSessionId } = resolveCartOwner(req, user);
  const body = cartItemSchema.parse(await req.json());
  const data = await cartService.addItem(owner, body);
  return withGuestCartCookie(created(data), newSessionId);
});
