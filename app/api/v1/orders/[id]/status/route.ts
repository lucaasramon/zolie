import { statusSchema } from '@/lib/validation/schemas';
import * as orderService from '@/lib/services/order.service';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

export const PATCH = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  const { status, descricao } = statusSchema.parse(await req.json());
  return ok(await orderService.updateStatus(id, status, descricao));
});
