import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Db = PrismaClient | Prisma.TransactionClient;

export interface VariantKey {
  productId: string;
  tamanho?: string | null;
  acabamento?: string | null;
}

/** `undefined` e `''` viram `null` — é assim que a variação "sem tamanho" é gravada. */
function normalizar({ productId, tamanho, acabamento }: VariantKey) {
  return {
    productId,
    tamanho: tamanho || null,
    acabamento: acabamento || null,
  };
}

export const variantRepo = {
  listByProduct: (productId: string) =>
    prisma.productVariant.findMany({
      where: { productId },
      orderBy: [{ tamanho: 'asc' }, { acabamento: 'asc' }],
    }),

  find: (key: VariantKey, db: Db = prisma) =>
    db.productVariant.findFirst({ where: normalizar(key) }),

  upsert: (key: VariantKey, data: { estoque?: number; pesoGramas?: number | null; ativo?: boolean }) => {
    const where = normalizar(key);
    return prisma.productVariant.upsert({
      where: {
        productId_tamanho_acabamento: {
          productId: where.productId,
          tamanho: where.tamanho as string,
          acabamento: where.acabamento as string,
        },
      },
      create: { ...where, estoque: data.estoque ?? 0, pesoGramas: data.pesoGramas, ativo: data.ativo ?? true },
      update: data,
    });
  },

  setEstoque: (id: string, estoque: number) =>
    prisma.productVariant.update({ where: { id }, data: { estoque } }),

  /**
   * Decrementa o estoque da variação. Devolve `null` quando o produto ainda não
   * tem variações cadastradas — nesse caso o controle segue apenas por
   * `Product.estoque`, e o chamador trata a ausência como "sem restrição".
   */
  decrementStock: async (key: VariantKey, qtd: number, db: Db = prisma) => {
    const variante = await db.productVariant.findFirst({ where: normalizar(key) });
    if (!variante) return null;
    return db.productVariant.update({
      where: { id: variante.id },
      data: { estoque: { decrement: qtd } },
    });
  },

  incrementStock: async (key: VariantKey, qtd: number, db: Db = prisma) => {
    const variante = await db.productVariant.findFirst({ where: normalizar(key) });
    if (!variante) return null;
    return db.productVariant.update({
      where: { id: variante.id },
      data: { estoque: { increment: qtd } },
    });
  },

  /** Soma o estoque de todas as variações — mantém `Product.estoque` coerente. */
  totalEstoque: async (productId: string, db: Db = prisma) => {
    const agg = await db.productVariant.aggregate({
      where: { productId, ativo: true },
      _sum: { estoque: true },
    });
    return agg._sum.estoque ?? 0;
  },

  /** Variações ativas com estoque igual ou abaixo do limite — alimenta o alerta do admin. */
  listEstoqueBaixo: (limite: number) =>
    prisma.productVariant.findMany({
      where: { ativo: true, estoque: { lte: limite }, product: { ativo: true } },
      include: { product: { select: { nome: true, slug: true } } },
      orderBy: { estoque: 'asc' },
    }),
};
