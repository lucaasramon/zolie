import * as notifications from '@/lib/services/notification.service';
import { noContent } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

export const PATCH = withAuth(async (_req, ctx, user) => {
  const { id } = await ctx.params;
  await notifications.marcarLida(id, user.sub);
  return noContent();
});
