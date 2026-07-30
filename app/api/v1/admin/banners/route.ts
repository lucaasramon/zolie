import { bannerSchema } from '@/lib/validation/schemas';
import * as bannerService from '@/lib/services/banner.service';
import { ok, created } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

export const GET = withAdmin(async () => ok(await bannerService.list()));

export const POST = withAdmin(async req => {
  const body = bannerSchema.parse(await req.json());
  return created(await bannerService.create(body));
});
