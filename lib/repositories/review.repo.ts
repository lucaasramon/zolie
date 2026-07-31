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
  findById: (id: string) => prisma.productReview.findUnique({ where: { id } }),
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
