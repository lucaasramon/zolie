import { supplySchema } from '@/lib/validation/schemas';
import { list, create } from '@/lib/services/supply.service';
import { ok, created } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

export const dynamic = 'force-dynamic';

export const GET = withAdmin(async () => ok(await list()));

export const POST = withAdmin(async req => {
  const body = supplySchema.parse(await req.json());
  return created(await create(body));
});
