import { prisma } from '@/lib/prisma';

export const bannerRepo = {
  list: () => prisma.banner.findMany({ where: { ativo: true }, orderBy: { ordem: 'asc' } }),
  findById: (id: string) => prisma.banner.findUnique({ where: { id } }),
  create: (data: any) => prisma.banner.create({ data }),
  update: (id: string, data: any) => prisma.banner.update({ where: { id }, data }),
  remove: (id: string) => prisma.banner.update({ where: { id }, data: { ativo: false } }).then(() => true),
};
