import { dashboard } from '@/lib/services/admin.service';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

export const GET = withAdmin(async () => ok(await dashboard()));
