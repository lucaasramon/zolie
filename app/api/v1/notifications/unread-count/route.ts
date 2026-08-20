import * as notifications from '@/lib/services/notification.service';
import { ok } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

export const GET = withAuth(async (_req, _ctx, user) => {
  const count = await notifications.contarNaoLidas(user.sub);
  return ok({ count });
});
