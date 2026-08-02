import { variantRepo } from '@/lib/repositories/variant.repo';
import { ok } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

const LIMITE_PADRAO = 5;

/** Variações no fim do estoque — alimenta o alerta do dashboard. */
export const GET = withAdmin(async req => {
  const limite = Number(new URL(req.url).searchParams.get('limite')) || LIMITE_PADRAO;
  const variantes = await variantRepo.listEstoqueBaixo(limite);

  return ok({
    limite,
    total: variantes.length,
    esgotadas: variantes.filter(v => v.estoque <= 0).length,
    itens: variantes.map(v => ({
      id: v.id,
      produto: v.product.nome,
      slug: v.product.slug,
      tamanho: v.tamanho,
      acabamento: v.acabamento,
      estoque: v.estoque,
    })),
  });
});
