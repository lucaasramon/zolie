import { revalidatePath } from 'next/cache';
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
  const config = await siteConfig.atualizar(body);
  // Home, FAQ e o cabeçalho da loja ficam em cache (revalidate); sem isto a
  // mudança do toggle levaria até 5 min para aparecer.
  revalidatePath('/', 'layout');
  return ok(config);
});
