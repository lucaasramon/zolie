import { prisma } from '@/lib/prisma';

export const reviewRepo = {
  listByProduct: async (productId: string, { skip = 0, take = 10 }: { skip?: number; take?: number } = {}) => {
    const where = { productId, aprovado: true };
    const [total, items] = await Promise.all([
      prisma.productReview.count({ where }),
      prisma.productReview.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { nome: true } } },
      }),
    ]);

    if (items.length === 0) return { total, items };

    const compradores = await prisma.orderItem.findMany({
      where: {
        productId,
        order: { userId: { in: items.map(i => i.userId) }, status: { not: 'CANCELADO' } },
      },
      select: { order: { select: { userId: true } } },
    });
    const userIdsCompraram = new Set(compradores.map(c => c.order.userId));

    return {
      total,
      items: items.map(i => ({ ...i, compraVerificada: userIdsCompraram.has(i.userId) })),
    };
  },
  listPending: async ({ skip = 0, take = 20 }: { skip?: number; take?: number } = {}) => {
    const where = { aprovado: false };
    const [total, items] = await Promise.all([
      prisma.productReview.count({ where }),
      prisma.productReview.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { nome: true } }, product: { select: { nome: true, slug: true } } },
      }),
    ]);
    return { total, items };
  },
  /** Avaliações aprovadas com foto de peças personalizadas ativas (vitrine dos Personalizados). */
  listComFotoPersonalizados: (take = 8) =>
    prisma.productReview.findMany({
      where: { aprovado: true, imagens: { isEmpty: false }, product: { personalizado: true, ativo: true } },
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        imagens: true,
        user: { select: { nome: true } },
        product: { select: { nome: true, slug: true } },
      },
    }),
  findById: (id: string) => prisma.productReview.findUnique({ where: { id } }),
  /** Quais destes produtos a cliente já avaliou (para não pedir avaliação de novo). */
  listProductIdsAvaliados: async (userId: string, productIds: string[]) => {
    const rows = await prisma.productReview.findMany({ where: { userId, productId: { in: productIds } }, select: { productId: true } });
    return new Set(rows.map(r => r.productId));
  },
  /**
   * Reserva o cupom de recompensa para a avaliação. Só grava se ainda estiver
   * vazio, então duas aprovações simultâneas não geram dois cupons: quem
   * recebe `false` não deve criar nada.
   */
  reservarCupomRecompensa: async (id: string, codigo: string) => {
    const { count } = await prisma.productReview.updateMany({ where: { id, cupomRecompensa: null }, data: { cupomRecompensa: codigo } });
    return count === 1;
  },
  liberarCupomRecompensa: (id: string) => prisma.productReview.update({ where: { id }, data: { cupomRecompensa: null } }),
  create: (data: { productId: string; userId: string; nota: number; titulo?: string; comentario?: string; imagens?: string[] }) =>
    prisma.productReview.create({ data }),
  findByUserAndProduct: (userId: string, productId: string) =>
    prisma.productReview.findUnique({ where: { productId_userId: { productId, userId } } }),
  setAprovado: (id: string, aprovado: boolean) => prisma.productReview.update({ where: { id }, data: { aprovado } }),
  recalcProduct: async (productId: string) => {
    const agg = await prisma.productReview.aggregate({
      where: { productId, aprovado: true },
      _avg: { nota: true },
      _count: true,
    });
    return prisma.product.update({
      where: { id: productId },
      data: { notaMedia: agg._avg.nota || 0, totalAvaliacoes: agg._count },
    });
  },
};
