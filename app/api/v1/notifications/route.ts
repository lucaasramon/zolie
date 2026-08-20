import * as notifications from '@/lib/services/notification.service';
import { parsePagination, meta } from '@/lib/utils/pagination';
import { ok } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

export const GET = withAuth(async (req, _ctx, user) => {
  const sp = req.nextUrl.searchParams;
  const pagination = parsePagination({ page: sp.get('page') ?? undefined, perPage: sp.get('perPage') ?? undefined });
  const { total, items } = await notifications.listarPorUsuario(user.sub, pagination);
  return ok(items, meta(total, pagination));
});
