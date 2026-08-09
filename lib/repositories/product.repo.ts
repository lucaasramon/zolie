import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Db = PrismaClient | Prisma.TransactionClient;

export interface ProductFilters {
  q?: string;
  categoria?: string;
  material?: string;
  pedra?: string;
  tamanho?: string;
  notaMin?: string | number;
  destaque?: boolean;
  lancamento?: boolean;
  promocao?: boolean;
  precoMin?: string | number;
  precoMax?: string | number;
}

const SORTS: Record<string, Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[]> = {
  menor_preco: { preco: 'asc' },
  maior_preco: { preco: 'desc' },
  mais_vendidos: { totalAvaliacoes: 'desc' },
  lancamentos: { createdAt: 'desc' },
  melhor_avaliados: { notaMedia: 'desc' },
  relevancia: [{ destaque: 'desc' }, { totalAvaliacoes: 'desc' }],
};

export const productRepo = {
  search: async (
    filters: ProductFilters = {},
    sort = 'relevancia',
    { skip = 0, take = 12 }: { skip?: number; take?: number } = {},
  ) => {
    const where: Prisma.ProductWhereInput = { ativo: true };
    if (filters.q) {
      where.OR = [
        { nome: { contains: filters.q, mode: 'insensitive' } },
        { descricao: { contains: filters.q, mode: 'insensitive' } },
      ];
    }
    if (filters.categoria) where.categoria = { slug: filters.categoria };
    if (filters.material) where.material = filters.material as any;
    if (filters.pedra) where.pedra = filters.pedra;
    if (filters.tamanho) where.tamanhos = { has: filters.tamanho };
    if (filters.notaMin) where.notaMedia = { gte: Number(filters.notaMin) };
    if (filters.destaque) where.destaque = true;
    if (filters.lancamento) where.lancamento = true;
    if (filters.promocao) where.precoPromocional = { not: null };
    if (filters.precoMin != null || filters.precoMax != null) {
      where.preco = {};
      if (filters.precoMin != null) (where.preco as any).gte = Number(filters.precoMin);
      if (filters.precoMax != null) (where.preco as any).lte = Number(filters.precoMax);
    }
    const orderBy = SORTS[sort] || [{ destaque: 'desc' }];

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, orderBy, skip, take, include: { categoria: true } }),
    ]);
    return { total, items };
  },
  findBySlug: (slug: string) => prisma.product.findFirst({ where: { slug, ativo: true }, include: { categoria: true } }),
  findById: (id: string) => prisma.product.findUnique({ where: { id }, include: { categoria: true } }),
  /** Resolve um slug antigo para o slug atual do produto — usado para redirecionar
   * URLs renomeadas em vez de deixá-las cair em 404. Produto inativo não redireciona:
   * cairia em 404 de qualquer forma via `findBySlug`. */
  findRedirectTarget: async (oldSlug: string) => {
    const hit = await prisma.productSlugHistory.findUnique({
      where: { oldSlug },
      include: { product: { select: { slug: true, ativo: true } } },
    });
    if (!hit || !hit.product.ativo) return null;
    return { novoSlug: hit.product.slug };
  },
  slugTaken: async (slug: string, ignoreId?: string) => {
    const found = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    return Boolean(found && found.id !== ignoreId);
  },
  findManyByIds: (ids: string[]) => prisma.product.findMany({ where: { id: { in: ids } }, include: { categoria: true } }),
  /** Slugs ativos — usado por `generateStaticParams` e pelo sitemap. */
  listSlugsAtivos: () => prisma.product.findMany({ where: { ativo: true }, select: { slug: true } }),
  /** Campos mínimos para a tela de precificação — evita carregar relações pesadas do catálogo. */
  listForPricing: () =>
    prisma.product.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        imagens: true,
        material: true,
        preco: true,
        precoCusto: true,
        custoSemijoia: true,
        custoEmbalagem: true,
        margemDesejada: true,
        productSupplies: { select: { supplyId: true } },
      },
      orderBy: { nome: 'asc' },
    }),
  create: (data: any) => prisma.product.create({ data }),
  update: (id: string, data: any) => prisma.product.update({ where: { id }, data }),
  remove: (id: string) => prisma.product.update({ where: { id }, data: { ativo: false } }).then(() => true),
  decrementStock: (id: string, qtd: number, db: Db = prisma) =>
    db.product.update({ where: { id }, data: { estoque: { decrement: qtd } } }),
  incrementStock: (id: string, qtd: number, db: Db = prisma) =>
    db.product.update({ where: { id }, data: { estoque: { increment: qtd } } }),
  findFrequentlyBoughtWith: async (productId: string, take = 6) => {
    // Produtos que apareceram no mesmo pedido de quem comprou `productId`,
    // ordenados por quantas vezes isso aconteceu.
    const rows = await prisma.$queryRaw<{ productId: string; vezes: bigint }[]>`
      SELECT oi2."product_id" AS "productId", COUNT(*) AS vezes
      FROM "order_items" oi1
      JOIN "order_items" oi2 ON oi1."order_id" = oi2."order_id" AND oi2."product_id" != oi1."product_id"
      WHERE oi1."product_id" = ${productId}
      GROUP BY oi2."product_id"
      ORDER BY vezes DESC
      LIMIT ${take}
    `;
    if (rows.length === 0) return [];
    const ids = rows.map(r => r.productId);
    const products = await prisma.product.findMany({ where: { id: { in: ids }, ativo: true }, include: { categoria: true } });
    const byId = new Map(products.map(p => [p.id, p]));
    return ids.map(id => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  },
};
