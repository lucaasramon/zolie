import { productRepo, ProductFilters } from '@/lib/repositories/product.repo';
import { notFound } from '@/lib/utils/errors';
import { precoEfetivo } from '@/lib/services/pricing.service';
import { env } from '@/lib/env';
import { round } from '@/lib/utils/money';
import { slugify } from '@/lib/utils/slug';

export function decorate(p: any) {
  const preco = precoEfetivo(p);
  return {
    ...p,
    // Campos Decimal/Date do Prisma não são serializáveis pela fronteira Server->Client
    // Component do React — convertidos aqui para number/string/ISO planos.
    preco: Number(p.preco),
    precoPromocional: p.precoPromocional != null ? Number(p.precoPromocional) : null,
    pesoGramas: p.pesoGramas != null ? Number(p.pesoGramas) : null,
    notaMedia: Number(p.notaMedia),
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
    categoria: p.categoria
      ? {
          ...p.categoria,
          createdAt: p.categoria.createdAt instanceof Date ? p.categoria.createdAt.toISOString() : p.categoria.createdAt,
        }
      : p.categoria,
    precoEfetivo: preco,
    temDesconto: p.precoPromocional != null,
    percentualDesconto: p.precoPromocional != null ? Math.round((1 - Number(p.precoPromocional) / Number(p.preco)) * 100) : 0,
    precoPix: round(preco * (1 - env.business.pixDiscountPercent / 100)),
    parcela: round(preco / env.business.maxInstallments),
    maxParcelas: env.business.maxInstallments,
    estoqueBaixo: p.estoque > 0 && p.estoque <= 8,
    disponivel: p.estoque > 0,
  };
}

export async function list(filters: ProductFilters, sort: string, pagination: { skip?: number; take?: number }) {
  const { total, items } = await productRepo.search(filters, sort, pagination);
  return { total, items: items.map(decorate) };
}

export async function bySlug(slug: string) {
  const p = await productRepo.findBySlug(slug);
  if (!p) throw notFound('Produto');

  const compradosJuntos = await productRepo.findFrequentlyBoughtWith(p.id, 6);
  const relacionadosIds = new Set(compradosJuntos.map(r => r.id));

  let relacionados = compradosJuntos;
  if (relacionados.length < 6) {
    const porCategoria = await productRepo.search(
      { categoria: p.categoria ? p.categoria.slug : undefined },
      'relevancia',
      { skip: 0, take: 12 },
    );
    for (const r of porCategoria.items) {
      if (relacionados.length >= 6) break;
      if (r.id === p.id || relacionadosIds.has(r.id)) continue;
      relacionados.push(r);
      relacionadosIds.add(r.id);
    }
  }

  return {
    ...decorate(p),
    relacionados: relacionados.slice(0, 6).map(decorate),
  };
}

async function uniqueSlug(nome: string, ignoreId?: string): Promise<string> {
  const base = slugify(nome);
  let slug = base;
  let n = 1;
  while (await productRepo.slugTaken(slug, ignoreId)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export const create = async (data: any) => {
  const slug = data.slug || (await uniqueSlug(data.nome));
  return productRepo.create({ ...data, slug }).then(decorate);
};
export const update = (id: string, data: any) =>
  productRepo.update(id, data).then(p => {
    if (!p) throw notFound('Produto');
    return decorate(p);
  });
export const remove = (id: string) => productRepo.remove(id);
