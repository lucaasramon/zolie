import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/http/withAuth';
import { ok } from '@/lib/http/envelope';
import { list } from '@/lib/services/product.service';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return ok([]);

  const { items } = await list({ q }, 'relevancia', { skip: 0, take: 5 });
  return ok(
    items.map(p => ({
      id: p.id,
      nome: p.nome,
      slug: p.slug,
      imagem: p.imagens?.[0] ?? null,
      precoEfetivo: p.precoEfetivo,
    })),
  );
});
