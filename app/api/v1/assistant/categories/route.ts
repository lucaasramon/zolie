import { NextRequest } from 'next/server';
import { categoryRepo } from '@/lib/repositories/category.repo';
import { ok } from '@/lib/http/envelope';
import { withAssistantAuth } from '@/lib/http/withAssistantAuth';
import { assertRateLimit } from '@/lib/http/rateLimit';

/** Lista as categorias ativas — para a IA saber o que existe antes de filtrar por categoria em /assistant/products. */
export const GET = withAssistantAuth(async req => {
  assertRateLimit(req as NextRequest, 'assistant:categories', { windowMs: 60_000, max: 30 });

  const categorias = await categoryRepo.list();
  return ok(categorias.map(c => ({ nome: c.nome, slug: c.slug })));
});
