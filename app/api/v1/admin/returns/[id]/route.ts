import { returnDecisionSchema } from '@/lib/validation/schemas';
import { decidir } from '@/lib/services/return.service';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

/** Aprova, recusa ou avança o status de uma solicitação de troca/devolução. */
export const PATCH = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  const dados = returnDecisionSchema.parse(await req.json());
  return ok(await decidir(id, dados));
});
