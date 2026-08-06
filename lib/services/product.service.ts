import { productRepo, ProductFilters } from '@/lib/repositories/product.repo';
import { prisma } from '@/lib/prisma';
import { notFound } from '@/lib/utils/errors';
import { precoEfetivo } from '@/lib/services/pricing.service';
import { env } from '@/lib/env';
import { round } from '@/lib/utils/money';
import { slugify } from '@/lib/utils/slug';

// Campos de custo/margem — informação interna de negócio, nunca exposta pela
// API pública. `decorate` os descarta; `decorateAdmin` os inclui para as telas /admin/*.
const CAMPOS_CUSTO = ['precoCusto', 'custoSemijoia', 'custoEmbalagem', 'margemDesejada'] as const;

export function decorate(p: any) {
  const preco = precoEfetivo(p);
  const semCustos = { ...p };
  for (const campo of CAMPOS_CUSTO) delete semCustos[campo];
  return {
    ...semCustos,
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

/** Igual a `decorate`, mas mantém os campos de custo/margem — uso restrito a telas /admin/*. */
export function decorateAdmin(p: any) {
  return {
    ...decorate(p),
    precoCusto: p.precoCusto != null ? Number(p.precoCusto) : null,
    custoSemijoia: p.custoSemijoia != null ? Number(p.custoSemijoia) : null,
    custoEmbalagem: p.custoEmbalagem != null ? Number(p.custoEmbalagem) : null,
    margemDesejada: p.margemDesejada != null ? Number(p.margemDesejada) : null,
  };
}

export async function list(filters: ProductFilters, sort: string, pagination: { skip?: number; take?: number }) {
  const { total, items } = await productRepo.search(filters, sort, pagination);
  return { total, items: items.map(decorate) };
}

/** Igual a `list`, mas com custos visíveis — uso restrito à listagem em /admin/produtos. */
export async function listAdmin(filters: ProductFilters, sort: string, pagination: { skip?: number; take?: number }) {
  const { total, items } = await productRepo.search(filters, sort, pagination);
  return { total, items: items.map(decorateAdmin) };
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

const ACABAMENTOS = ['Polido', 'Fosco'];

/**
 * Gera as variações (tamanho × acabamento) de um produto e distribui o estoque
 * informado entre elas. Sem isso um produto novo nasceria sem variação e o
 * checkout — que valida a variação — não conseguiria vendê-lo.
 */
async function criarVariacoes(productId: string, tamanhos: string[] | undefined, estoqueTotal: number) {
  const listaTamanhos = tamanhos?.length ? tamanhos : [null];
  const combinacoes = listaTamanhos.flatMap(tamanho =>
    ACABAMENTOS.map(acabamento => ({ tamanho, acabamento })),
  );

  // Divide o estoque entre as variações (resto na primeira), em vez de repetir o
  // total em cada uma — repetir multiplicaria o estoque real.
  const base = Math.floor(estoqueTotal / combinacoes.length);
  const resto = estoqueTotal % combinacoes.length;

  await prisma.productVariant.createMany({
    data: combinacoes.map((c, i) => ({
      productId,
      tamanho: c.tamanho,
      acabamento: c.acabamento,
      estoque: base + (i === 0 ? resto : 0),
    })),
    skipDuplicates: true,
  });
}

export const create = async (data: any) => {
  const slug = data.slug || (await uniqueSlug(data.nome));
  const produto = await productRepo.create({ ...data, slug });
  await criarVariacoes(produto.id, data.tamanhos, Number(data.estoque) || 0);
  return decorate(produto);
};

export const update = async (id: string, data: any) => {
  // `estoque` é derivado da soma das variações e não pode ser gravado direto:
  // fazer isso dessincronizaria o total e travaria a venda no checkout, que
  // valida os dois. A edição de estoque passa por /admin/variants/[id].
  const { estoque, ...semEstoque } = data;

  const p = await productRepo.update(id, semEstoque);
  if (!p) throw notFound('Produto');

  // Tamanho novo no cadastro precisa de variação correspondente, senão fica
  // selecionável na loja e sem estoque possível.
  if (data.tamanhos) await criarVariacoes(id, data.tamanhos, 0);

  const atualizado = await productRepo.findById(id);
  return decorate(atualizado ?? p);
};
export const remove = (id: string) => productRepo.remove(id);

export async function savePricing(
  id: string,
  data: { custoSemijoia?: number | null; custoEmbalagem?: number | null; margemDesejada?: number | null; supplyIds?: string[] },
) {
  const { supplyIds, ...campos } = data;

  const produto = await prisma.$transaction(async tx => {
    const atualizado = await tx.product
      .update({ where: { id }, data: campos })
      .catch(() => null);
    if (!atualizado) return null;

    if (supplyIds) {
      await tx.productSupply.deleteMany({ where: { productId: id } });
      if (supplyIds.length > 0) {
        await tx.productSupply.createMany({
          data: supplyIds.map(supplyId => ({ productId: id, supplyId })),
          skipDuplicates: true,
        });
      }
    }
    return atualizado;
  });

  if (!produto) throw notFound('Produto');
  return decorate(produto);
}
