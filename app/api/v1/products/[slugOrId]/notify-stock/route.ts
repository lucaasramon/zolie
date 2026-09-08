import { stockNotificationSchema } from '@/lib/validation/schemas';
import { inscrever } from '@/lib/services/stockNotification.service';
import { created } from '@/lib/http/envelope';
import { withErrorHandling } from '@/lib/http/withAuth';

export const POST = withErrorHandling(async (req, ctx) => {
  const { slugOrId } = await ctx.params;
  const { email } = stockNotificationSchema.parse(await req.json());
  await inscrever(slugOrId, email);
  return created({ mensagem: 'Vamos te avisar quando esta peça chegar' });
});
