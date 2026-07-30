import { cepSchema } from '@/lib/validation/schemas';
import * as cartService from '@/lib/services/cart.service';
import * as shipping from '@/lib/services/shipping.service';
import { ok } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

export const POST = withAuth(async (req, _ctx, user) => {
  const { cep } = cepSchema.parse(await req.json());
  const cart = await cartService.get(user.sub);
  return ok(await shipping.cotar(cep, cart.resumo.subtotal));
});
