import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Db = PrismaClient | Prisma.TransactionClient;

export const couponRepo = {
  list: () => prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } }),
  findByCode: (codigo: string) => prisma.coupon.findUnique({ where: { codigo: String(codigo).toUpperCase() } }),
  findById: (id: string) => prisma.coupon.findUnique({ where: { id } }),
  create: (data: any) => prisma.coupon.create({ data: { ...data, codigo: String(data.codigo).toUpperCase() } }),
  update: (id: string, data: any) => prisma.coupon.update({ where: { id }, data }),
  remove: (id: string) => prisma.coupon.update({ where: { id }, data: { ativo: false } }).then(() => true),
  incrementUse: (id: string, db: Db = prisma) =>
    db.coupon.update({ where: { id }, data: { usos: { increment: 1 } } }),
  /** Devolve o uso ao cancelar/expirar um pedido. Protegido para nunca ficar negativo. */
  decrementUseByCode: (codigo: string, db: Db = prisma) =>
    db.coupon.updateMany({
      where: { codigo: String(codigo).toUpperCase(), usos: { gt: 0 } },
      data: { usos: { decrement: 1 } },
    }),
  findActiveWelcomeCoupon: () =>
    prisma.coupon.findFirst({
      where: {
        ativo: true,
        restricaoCompra: 'PRIMEIRA',
        OR: [{ validade: null }, { validade: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    }),
  /** Cupom de "obrigada por voltar" enviado por e-mail após a 1ª compra ser paga. */
  findActiveComebackCoupon: () =>
    prisma.coupon.findFirst({
      where: {
        ativo: true,
        restricaoCompra: 'SEGUNDA',
        OR: [{ validade: null }, { validade: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    }),
  hasRedeemed: async (couponId: string, userId: string, db: Db = prisma) => {
    const found = await db.couponRedemption.findUnique({ where: { couponId_userId: { couponId, userId } } });
    return Boolean(found);
  },
  recordRedemption: (couponId: string, userId: string, orderId: string, db: Db = prisma) =>
    db.couponRedemption.create({ data: { couponId, userId, orderId } }),
  /** Libera o cupom para o usuário quando o pedido correspondente é cancelado/expira sem pagamento. */
  removeRedemptionByCode: async (codigo: string, userId: string, db: Db = prisma) => {
    const cupom = await db.coupon.findUnique({ where: { codigo: String(codigo).toUpperCase() }, select: { id: true } });
    if (!cupom) return;
    await db.couponRedemption.deleteMany({ where: { couponId: cupom.id, userId } });
  },
};
