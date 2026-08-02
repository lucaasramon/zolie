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
        primeiraCompra: true,
        OR: [{ validade: null }, { validade: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    }),
};
