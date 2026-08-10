import { siteConfigSchema } from '@/lib/validation/schemas';
import * as siteConfig from '@/lib/services/site-config.service';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

export const GET = withAdmin(async () => {
  await siteConfig.preparar();
  return ok(siteConfig.get());
});

export const PATCH = withAdmin(async req => {
  const body = siteConfigSchema.parse(await req.json());
  return ok(await siteConfig.atualizar(body));
});
