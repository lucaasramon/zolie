import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

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
  slugTaken: async (slug: string, ignoreId?: string) => {
    const found = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    return Boolean(found && found.id !== ignoreId);
  },
  findManyByIds: (ids: string[]) => prisma.product.findMany({ where: { id: { in: ids } }, include: { categoria: true } }),
  create: (data: any) => prisma.product.create({ data }),
  update: (id: string, data: any) => prisma.product.update({ where: { id }, data }),
  remove: (id: string) => prisma.product.update({ where: { id }, data: { ativo: false } }).then(() => true),
  decrementStock: (id: string, qtd: number) =>
    prisma.product.update({ where: { id }, data: { estoque: { decrement: qtd } } }),
};
