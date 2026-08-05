import { pricingSchema } from '@/lib/validation/schemas';
import { savePricing } from '@/lib/services/product.service';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

export const PUT = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = pricingSchema.parse(await req.json());
  return ok(await savePricing(id, body));
});
