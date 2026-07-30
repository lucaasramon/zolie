/**
 * >>> POSTGRES <<< Implementação Prisma de ProductReview.
 * Mesma interface do repositório em memória. Ativa quando DATA_SOURCE=prisma
 * e o bloco de src/database/prismaClient.js estiver descomentado.
 */
const { prisma } = require('../../database/prismaClient');

module.exports = {
  listByProduct: async (productId, { skip = 0, take = 10 } = {}) => {
    const where = { productId, aprovado: true };
    const [total, items] = await Promise.all([
      prisma.productReview.count({ where }),
      prisma.productReview.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { user: { select: { nome: true } } } })
    ]);
    return { total, items };
  },
  create: data => prisma.productReview.create({ data }),
  findByUserAndProduct: (userId, productId) => prisma.productReview.findUnique({ where: { productId_userId: { productId, userId } } }),
  recalcProduct: async productId => {
    const agg = await prisma.productReview.aggregate({ where: { productId, aprovado: true }, _avg: { nota: true }, _count: true });
    return prisma.product.update({
      where: { id: productId },
      data: { notaMedia: agg._avg.nota || 0, totalAvaliacoes: agg._count }
    });
  }
};
