import * as reviewService from '@/lib/services/review.service';
import { parsePagination, meta } from '@/lib/utils/pagination';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

export const GET = withAdmin(async req => {
  const sp = req.nextUrl.searchParams;
  const pagination = parsePagination({ page: sp.get('page') ?? undefined, perPage: sp.get('perPage') ?? undefined });
  const { total, items } = await reviewService.listPending(pagination);
  return ok(items, meta(total, pagination));
});
