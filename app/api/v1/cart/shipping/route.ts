import { cepSchema } from '@/lib/validation/schemas';
import * as cartService from '@/lib/services/cart.service';
import * as shipping from '@/lib/services/shipping.service';
import { ok } from '@/lib/http/envelope';
import { withOptionalAuth } from '@/lib/http/withAuth';
import { resolveCartOwner, withGuestCartCookie } from '@/lib/http/cartOwner';

export const POST = withOptionalAuth(async (req, _ctx, user) => {
  const { owner, newSessionId } = resolveCartOwner(req, user);
  const { cep } = cepSchema.parse(await req.json());
  const cart = await cartService.get(owner);
  const data = await shipping.cotar(cep, cart.resumo.subtotal, {
    itens: cart.items.map(i => ({ quantidade: i.quantidade, pesoGramas: i.pesoGramas })),
  });
  return withGuestCartCookie(ok(data), newSessionId);
});
