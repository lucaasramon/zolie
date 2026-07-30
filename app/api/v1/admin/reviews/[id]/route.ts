import { z } from 'zod';
import * as reviewService from '@/lib/services/review.service';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

const moderateSchema = z.object({ aprovado: z.boolean() });

export const PATCH = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  const { aprovado } = moderateSchema.parse(await req.json());
  return ok(await reviewService.moderar(id, aprovado));
});
