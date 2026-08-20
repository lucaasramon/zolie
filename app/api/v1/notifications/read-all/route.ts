import * as notifications from '@/lib/services/notification.service';
import { ok } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

export const PATCH = withAuth(async (_req, _ctx, user) => {
  const result = await notifications.marcarTodasLidas(user.sub);
  return ok(result);
});
