import { prisma } from '@/lib/prisma';

export const supplyRepo = {
  list: () => prisma.supply.findMany({ orderBy: { createdAt: 'desc' } }),
  findById: (id: string) => prisma.supply.findUnique({ where: { id } }),
  create: (data: any) => prisma.supply.create({ data }),
  update: (id: string, data: any) => prisma.supply.update({ where: { id }, data }),
  remove: (id: string) => prisma.supply.update({ where: { id }, data: { ativo: false } }).then(() => true),
};
