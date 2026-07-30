import { categorySchema } from '@/lib/validation/schemas';
import { list, create } from '@/lib/services/category.service';
import { ok, created } from '@/lib/http/envelope';
import { withAdmin, withErrorHandling } from '@/lib/http/withAuth';

export const GET = withErrorHandling(async () => ok(await list()));

export const POST = withAdmin(async req => {
  const body = categorySchema.parse(await req.json());
  return created(await create(body));
});
