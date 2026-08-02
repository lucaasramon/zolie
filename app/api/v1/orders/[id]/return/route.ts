import { returnRequestSchema } from '@/lib/validation/schemas';
import { criar } from '@/lib/services/return.service';
import { created } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

/** Abre uma solicitação de troca/devolução para um pedido entregue. */
export const POST = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const dados = returnRequestSchema.parse(await req.json());
  return created(await criar(user.sub, id, dados));
});
