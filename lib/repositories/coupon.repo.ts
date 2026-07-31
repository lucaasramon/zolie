import { prisma } from '@/lib/prisma';

export const couponRepo = {
  list: () => prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } }),
  findByCode: (codigo: string) => prisma.coupon.findUnique({ where: { codigo: String(codigo).toUpperCase() } }),
  findById: (id: string) => prisma.coupon.findUnique({ where: { id } }),
  create: (data: any) => prisma.coupon.create({ data: { ...data, codigo: String(data.codigo).toUpperCase() } }),
  update: (id: string, data: any) => prisma.coupon.update({ where: { id }, data }),
  remove: (id: string) => prisma.coupon.update({ where: { id }, data: { ativo: false } }).then(() => true),
  incrementUse: (id: string) => prisma.coupon.update({ where: { id }, data: { usos: { increment: 1 } } }),
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
