import { prisma } from '@/lib/prisma';
import { Prisma, OrderStatus } from '@prisma/client';

export const orderRepo = {
  create: (order: Prisma.OrderUncheckedCreateInput, items: Prisma.OrderItemCreateManyOrderInput[]) =>
    prisma.order.create({
      data: {
        ...order,
        items: { create: items },
        events: { create: { status: order.status as OrderStatus, descricao: 'Pedido criado' } },
      },
      include: { items: true, events: true, endereco: true },
    }),
  listByUser: async (userId: string, { skip = 0, take = 10 }: { skip?: number; take?: number } = {}) => {
    const [total, items] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.order.findMany({ where: { userId }, skip, take, orderBy: { createdAt: 'desc' }, include: { items: true } }),
    ]);
    return { total, items };
  },
  listAll: async ({ skip = 0, take = 20, status }: { skip?: number; take?: number; status?: string } = {}) => {
    const where = status ? { status: status as OrderStatus } : {};
    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { items: true, user: { select: { nome: true, email: true } } },
      }),
    ]);
    return { total, items };
  },
  findById: (id: string) =>
    prisma.order.findUnique({
      where: { id },
      include: { items: true, events: true, endereco: true, user: { select: { nome: true, email: true, telefone: true } } },
    }),
  updateStatus: (id: string, status: OrderStatus, descricao?: string) =>
    prisma.order.update({
      where: { id },
      data: { status, events: { create: { status, descricao } } },
      include: { items: true, events: true, user: { select: { nome: true, email: true } } },
    }),
  setAsaasPayment: (id: string, asaasPaymentId: string, asaasStatus: string) =>
    prisma.order.update({ where: { id }, data: { asaasPaymentId, asaasStatus } }),
  findByAsaasPaymentId: (asaasPaymentId: string) =>
    prisma.order.findUnique({ where: { asaasPaymentId } }),
  updateAsaasStatus: (id: string, asaasStatus: string) =>
    prisma.order.update({ where: { id }, data: { asaasStatus } }),
  nextNumber: async () => 'ZL-' + String(2495 + (await prisma.order.count())),
  salesSummary: async () => {
    const agg = await prisma.order.aggregate({
      where: { status: { not: 'CANCELADO' } },
      _sum: { total: true },
      _count: true,
      _avg: { total: true },
    });
    return {
      pedidos: agg._count,
      faturamento: Number(agg._sum.total || 0),
      ticketMedio: Number(agg._avg.total || 0),
    };
  },
  salesByDay: async (days = 7) => {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);
    const rows = await prisma.$queryRaw<{ dia: Date; total: Prisma.Decimal }[]>`
      SELECT date_trunc('day', "created_at") AS dia, SUM("total") AS total
      FROM "orders"
      WHERE "created_at" >= ${since} AND "status" != 'CANCELADO'
      GROUP BY dia
      ORDER BY dia ASC
    `;
    return rows.map(r => ({ dia: r.dia, total: Number(r.total) }));
  },
};
