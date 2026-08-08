import { orderSchema } from '@/lib/validation/schemas';
import * as orderService from '@/lib/services/order.service';
import { parsePagination, meta } from '@/lib/utils/pagination';
import { ok, created } from '@/lib/http/envelope';
import { withAuth, withOptionalAuth } from '@/lib/http/withAuth';
import { resolveCartOwner, withGuestCartCookie } from '@/lib/http/cartOwner';

export const POST = withOptionalAuth(async (req, _ctx, user) => {
  const body = orderSchema.parse(await req.json());
  const { owner, newSessionId } = resolveCartOwner(req, user);
  const remoteIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
  const result = await orderService.create(user?.sub ?? null, owner, { ...body, remoteIp });
  return withGuestCartCookie(created(result), newSessionId);
});

export const GET = withAuth(async (req, _ctx, user) => {
  const sp = req.nextUrl.searchParams;
  const pagination = parsePagination({ page: sp.get('page') ?? undefined, perPage: sp.get('perPage') ?? undefined });
  const { total, items } = await orderService.listMine(user.sub, pagination);
  return ok(items, meta(total, pagination));
});
