import { cartItemSchema } from '@/lib/validation/schemas';
import * as cartService from '@/lib/services/cart.service';
import { created } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

export const POST = withAuth(async (req, _ctx, user) => {
  const body = cartItemSchema.parse(await req.json());
  return created(await cartService.addItem(user.sub, body));
});
