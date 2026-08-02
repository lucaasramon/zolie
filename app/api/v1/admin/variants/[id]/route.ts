import { variantRepo } from '@/lib/repositories/variant.repo';
import { variantStockSchema } from '@/lib/validation/schemas';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

/**
 * Ajusta o estoque de uma variação. `Product.estoque` é recalculado como soma das
 * variações — nunca editado diretamente, para os dois não divergirem.
 */
export const PATCH = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  const { estoque } = variantStockSchema.parse(await req.json());
  return ok(await variantRepo.setEstoqueESincronizar(id, estoque));
});
