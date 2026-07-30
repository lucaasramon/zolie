import { prisma } from '@/lib/prisma';

export const categoryRepo = {
  list: () =>
    prisma.category.findMany({
      where: { ativa: true },
      orderBy: { ordem: 'asc' },
      include: { _count: { select: { products: true } } },
    }),
  findBySlug: (slug: string) => prisma.category.findUnique({ where: { slug } }),
  findById: (id: string) => prisma.category.findUnique({ where: { id } }),
  create: (data: any) => prisma.category.create({ data }),
  update: (id: string, data: any) => prisma.category.update({ where: { id }, data }),
  remove: (id: string) => prisma.category.update({ where: { id }, data: { ativa: false } }).then(() => true),
};
