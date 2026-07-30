import { prisma } from '@/lib/prisma';

export const addressRepo = {
  listByUser: (userId: string) => prisma.address.findMany({ where: { userId }, orderBy: { principal: 'desc' } }),
  findById: (id: string) => prisma.address.findUnique({ where: { id } }),
  create: async (userId: string, data: any) => {
    if (data.principal) await prisma.address.updateMany({ where: { userId }, data: { principal: false } });
    return prisma.address.create({ data: { ...data, userId } });
  },
  update: (id: string, data: any) => prisma.address.update({ where: { id }, data }),
  remove: (id: string) => prisma.address.delete({ where: { id } }).then(() => true),
};
