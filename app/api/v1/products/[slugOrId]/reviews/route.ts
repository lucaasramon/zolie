import { reviewSchema } from '@/lib/validation/schemas';
import { list, create } from '@/lib/services/review.service';
import { parsePagination, meta } from '@/lib/utils/pagination';
import { ok, created } from '@/lib/http/envelope';
import { withAuth, withErrorHandling } from '@/lib/http/withAuth';

export const GET = withErrorHandling(async (req, ctx) => {
  const { slugOrId } = await ctx.params;
  const sp = req.nextUrl.searchParams;
  const pagination = parsePagination({ page: sp.get('page') ?? undefined, perPage: sp.get('perPage') ?? undefined });
  const { total, items } = await list(slugOrId, pagination);
  return ok(items, meta(total, pagination));
});

export const POST = withAuth(async (req, ctx, user) => {
  const { slugOrId } = await ctx.params;
  const body = reviewSchema.parse(await req.json());
  return created(await create(user.sub, slugOrId, body));
});
