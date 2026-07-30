import * as orderService from '@/lib/services/order.service';
import { ok } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

export const GET = withAuth(async (_req, ctx, user) => {
  const { id } = await ctx.params;
  return ok(await orderService.retomarPagamento(user.sub, id, user.role === 'ADMIN'));
});
