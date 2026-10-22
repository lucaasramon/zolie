import { Material, Prisma, PrismaClient } from '@prisma/client';
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
  personalizado?: boolean;
  precoMin?: string | number;
  precoMax?: string | number;
  /** Só /admin/produtos: filtra por anúncio ativo/pausado. */
  ativo?: boolean;
  /** Só /admin/produtos: 'baixo' = 1 a 8 unidades (mesma regra de `estoqueBaixo`), 'zerado' = esgotado. */
  estoque?: 'baixo' | 'zerado';
}

const MATERIAIS = new Set<string>(Object.values(Material));

// Preço que a cliente de fato vê no card (promocional quando existe) — filtro de
// faixa de preço e ordenação por preço precisam usar o mesmo valor, senão uma
// peça de R$ 250 em promoção por R$ 150 aparece em "Acima de R$ 200".
const PRECO_EFETIVO_SQL = Prisma.sql`COALESCE(p.preco_promocional, p.preco)`;

// Unidades vendidas em pedidos pagos (cancelados e aguardando pagamento não contam).
const VENDIDOS_SQL = Prisma.sql`(
  SELECT COALESCE(SUM(oi.quantidade), 0) FROM "order_items" oi
  JOIN "orders" o ON o.id = oi.order_id
  WHERE oi.product_id = p.id AND o.status IN ('PROCESSANDO', 'SEPARANDO', 'ENVIADO', 'ENTREGUE')
)`;

// Segundo critério de ordenação (após "esgotado sempre por último"), aplicado
// em SQL puro — usado por `search()` na query raw.
const SORTS_SQL: Record<string, Prisma.Sql> = {
  menor_preco: Prisma.sql`${PRECO_EFETIVO_SQL} ASC`,
  maior_preco: Prisma.sql`${PRECO_EFETIVO_SQL} DESC`,
  mais_vendidos: Prisma.sql`${VENDIDOS_SQL} DESC, p.total_avaliacoes DESC`,
  lancamentos: Prisma.sql`p.created_at DESC`,
  melhor_avaliados: Prisma.sql`p.nota_media DESC, p.total_avaliacoes DESC`,
  relevancia: Prisma.sql`p.destaque DESC, p.total_avaliacoes DESC`,
};

/** Número vindo da querystring — `undefined` para vazio/inválido, em vez de NaN chegar ao SQL. */
function numeroOuUndefined(v: string | number | undefined): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Escapa curingas do ILIKE: buscar "50%" não pode virar "qualquer coisa começando com 50". */
function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, c => `\\${c}`);
}

export const productRepo = {
  /**
   * Produtos esgotados (`estoque = 0`) sempre por último, qualquer que seja o
   * filtro/ordenação escolhidos — por isso a query é montada em SQL puro em vez
   * do `orderBy` do Prisma Client, que não expressa uma condição (`CASE WHEN`)
   * como critério de ordenação. Os filtros abaixo espelham exatamente o `where`
   * que o Prisma Client montaria.
   */
  search: async (
    filters: ProductFilters = {},
    sort = 'relevancia',
    { skip = 0, take = 12 }: { skip?: number; take?: number } = {},
    { incluirInativos = false }: { incluirInativos?: boolean } = {},
  ) => {
    // `TRUE` como base quando inclui inativos: mantém a query válida (Prisma.join
    // de uma lista vazia geraria `WHERE ` sem nada depois) sem reintroduzir o filtro
    // de ativo que este modo existe justamente para pular.
    const conditions: Prisma.Sql[] = incluirInativos ? [Prisma.sql`TRUE`] : [Prisma.sql`p.ativo = true`];
    const q = filters.q?.trim();
    if (q) {
      const termo = `%${escapeLike(q)}%`;
      conditions.push(Prisma.sql`(p.nome ILIKE ${termo} OR p.descricao ILIKE ${termo})`);
    }
    // "personalizados" é a categoria virtual da vitrine (ver category.service):
    // filtra pela flag do produto, não pela categoria do banco.
    if (filters.categoria === 'personalizados') conditions.push(Prisma.sql`p.personalizado = true`);
    else if (filters.categoria) conditions.push(Prisma.sql`c.slug = ${filters.categoria}`);
    if (filters.personalizado) conditions.push(Prisma.sql`p.personalizado = true`);
    // Material fora do enum faria o cast `::"Material"` estourar erro no Postgres
    // (500 na página) — valor desconhecido na URL é simplesmente ignorado.
    if (filters.material && MATERIAIS.has(filters.material)) {
      conditions.push(Prisma.sql`p.material = ${filters.material}::"Material"`);
    }
    if (filters.pedra) conditions.push(Prisma.sql`p.pedra = ${filters.pedra}`);
    if (filters.tamanho) conditions.push(Prisma.sql`${filters.tamanho} = ANY(p.tamanhos)`);
    const notaMin = numeroOuUndefined(filters.notaMin);
    if (notaMin != null) conditions.push(Prisma.sql`p.nota_media >= ${notaMin}`);
    if (filters.destaque) conditions.push(Prisma.sql`p.destaque = true`);
    if (filters.lancamento) conditions.push(Prisma.sql`p.lancamento = true`);
    if (filters.promocao) conditions.push(Prisma.sql`p.preco_promocional IS NOT NULL`);
    const precoMin = numeroOuUndefined(filters.precoMin);
    const precoMax = numeroOuUndefined(filters.precoMax);
    if (precoMin != null) conditions.push(Prisma.sql`${PRECO_EFETIVO_SQL} >= ${precoMin}`);
    if (precoMax != null) conditions.push(Prisma.sql`${PRECO_EFETIVO_SQL} <= ${precoMax}`);
    if (filters.ativo != null) conditions.push(Prisma.sql`p.ativo = ${filters.ativo}`);
    if (filters.estoque === 'zerado') conditions.push(Prisma.sql`p.estoque = 0`);
    if (filters.estoque === 'baixo') conditions.push(Prisma.sql`p.estoque BETWEEN 1 AND 8`);

    const where = Prisma.join(conditions, ' AND ');
    const orderBySecundario = SORTS_SQL[sort] || SORTS_SQL.relevancia;

    const [totalRows, rows] = await Promise.all([
      prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*) AS total FROM "products" p JOIN "categories" c ON c.id = p.categoria_id WHERE ${where}
      `,
      prisma.$queryRaw<{ id: string }[]>`
        SELECT p.id FROM "products" p JOIN "categories" c ON c.id = p.categoria_id WHERE ${where}
        ORDER BY (CASE WHEN p.estoque > 0 THEN 0 ELSE 1 END), ${orderBySecundario}
        LIMIT ${take} OFFSET ${skip}
      `,
    ]);

    const total = Number(totalRows[0]?.total ?? 0);
    if (rows.length === 0) return { total, items: [] };

    // A ordem de `findMany` com `id IN (...)` não é garantida — busca os dados
    // completos e reordena pela ordem já decidida pela query raw acima.
    const ids = rows.map(r => r.id);
    const produtos = await prisma.product.findMany({ where: { id: { in: ids } }, include: { categoria: true } });
    const byId = new Map(produtos.map(p => [p.id, p]));
    const items = ids.map(id => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));

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
