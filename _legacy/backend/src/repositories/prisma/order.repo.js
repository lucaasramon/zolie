/**
 * >>> POSTGRES <<< Implementação Prisma de Order.
 * Mesma interface do repositório em memória. Ativa quando DATA_SOURCE=prisma
 * e o bloco de src/database/prismaClient.js estiver descomentado.
 */
const { prisma } = require('../../database/prismaClient');

module.exports = {
  create: (order, items) => prisma.order.create({
    data: {
      ...order,
      items: { create: items },
      events: { create: { status: order.status, descricao: 'Pedido criado' } }
    },
    include: { items: true, events: true, endereco: true }
  }),
  listByUser: async (userId, { skip = 0, take = 10 } = {}) => {
    const [total, items] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.order.findMany({ where: { userId }, skip, take, orderBy: { createdAt: 'desc' }, include: { items: true } })
    ]);
    return { total, items };
  },
  listAll: async ({ skip = 0, take = 20, status } = {}) => {
    const where = status ? { status } : {};
    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { items: true, user: { select: { nome: true, email: true } } } })
    ]);
    return { total, items };
  },
  findById: id => prisma.order.findUnique({ where: { id }, include: { items: true, events: true, endereco: true } }),
  updateStatus: (id, status, descricao) => prisma.order.update({
    where: { id },
    data: { status, events: { create: { status, descricao } } },
    include: { items: true, events: true }
  }),
  nextNumber: async () => 'ZL-' + String(2495 + (await prisma.order.count())),
  salesSummary: async () => {
    const agg = await prisma.order.aggregate({ where: { status: { not: 'CANCELADO' } }, _sum: { total: true }, _count: true, _avg: { total: true } });
    return { pedidos: agg._count, faturamento: Number(agg._sum.total || 0), ticketMedio: Number(agg._avg.total || 0) };
  }
};
