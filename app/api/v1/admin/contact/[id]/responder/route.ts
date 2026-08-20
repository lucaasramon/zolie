import { contactResponderSchema } from '@/lib/validation/schemas';
import { responder } from '@/lib/services/contact.service';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

export const POST = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  const { resposta } = contactResponderSchema.parse(await req.json());
  return ok(await responder(id, resposta));
});
