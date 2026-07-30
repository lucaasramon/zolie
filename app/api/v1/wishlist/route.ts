import * as wishlist from '@/lib/services/wishlist.service';
import { ok } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

export const GET = withAuth(async (_req, _ctx, user) => ok(await wishlist.list(user.sub)));
