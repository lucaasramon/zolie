import { z } from 'zod';
import { marcarRespondida } from '@/lib/services/contact.service';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

const schema = z.object({ respondida: z.boolean() });

export const PATCH = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  const { respondida } = schema.parse(await req.json());
  return ok(await marcarRespondida(id, respondida));
});
