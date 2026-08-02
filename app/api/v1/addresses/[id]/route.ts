import { addressSchema } from '@/lib/validation/schemas';
import { addressRepo } from '@/lib/repositories/address.repo';
import { notFound, forbidden } from '@/lib/utils/errors';
import { ok, noContent } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

async function owned(id: string, userId: string) {
  // `findAtivoById`: endereço já removido não pode ser editado nem apagado de novo.
  const a = await addressRepo.findAtivoById(id);
  if (!a) throw notFound('Endereço');
  if (a.userId !== userId) throw forbidden();
  return a;
}

export const PUT = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  await owned(id, user.sub);
  const body = addressSchema.partial().parse(await req.json());
  return ok(await addressRepo.update(id, body));
});

export const DELETE = withAuth(async (_req, ctx, user) => {
  const { id } = await ctx.params;
  await owned(id, user.sub);
  await addressRepo.remove(id);
  return noContent();
});
