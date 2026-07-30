import { prisma } from '@/lib/prisma';

export const wishlistRepo = {
  listByUser: (userId: string) => prisma.wishlistItem.findMany({ where: { userId }, include: { product: true } }),
  add: (userId: string, productId: string) =>
    prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    }),
  remove: (userId: string, productId: string) =>
    prisma.wishlistItem.delete({ where: { userId_productId: { userId, productId } } }).then(() => true),
};
