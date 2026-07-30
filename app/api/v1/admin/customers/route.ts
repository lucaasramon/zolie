import { userRepo } from '@/lib/repositories/user.repo';
import { publicUser } from '@/lib/services/auth.service';
import { parsePagination, meta } from '@/lib/utils/pagination';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

export const GET = withAdmin(async req => {
  const sp = req.nextUrl.searchParams;
  const pagination = parsePagination({ page: sp.get('page') ?? undefined, perPage: sp.get('perPage') ?? undefined });
  const { total, items } = await userRepo.listAll(pagination);
  return ok(items.map(publicUser), meta(total, pagination));
});
