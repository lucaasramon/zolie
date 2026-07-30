import { NextRequest } from 'next/server';
import { productSchema } from '@/lib/validation/schemas';
import { list, create } from '@/lib/services/product.service';
import { parsePagination, meta } from '@/lib/utils/pagination';
import { ok, created } from '@/lib/http/envelope';
import { withAdmin, withErrorHandling } from '@/lib/http/withAuth';

export const GET = withErrorHandling(async req => {
  const sp = req.nextUrl.searchParams;
  const pagination = parsePagination({ page: sp.get('page') ?? undefined, perPage: sp.get('perPage') ?? undefined });
  const filters = {
    q: sp.get('q') ?? undefined,
    categoria: sp.get('categoria') ?? undefined,
    material: sp.get('material') ?? undefined,
    pedra: sp.get('pedra') ?? undefined,
    tamanho: sp.get('tamanho') ?? undefined,
    notaMin: sp.get('notaMin') ?? undefined,
    precoMin: sp.get('precoMin') ?? undefined,
    precoMax: sp.get('precoMax') ?? undefined,
    destaque: sp.get('destaque') === 'true',
    lancamento: sp.get('lancamento') === 'true',
    promocao: sp.get('promocao') === 'true',
  };
  const { total, items } = await list(filters, sp.get('sort') ?? 'relevancia', pagination);
  return ok(items, meta(total, pagination));
});

export const POST = withAdmin(async req => {
  const body = productSchema.parse(await req.json());
  return created(await create(body));
});
