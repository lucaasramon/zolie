import { prisma } from '@/lib/prisma';

export const cartRepo = {
  getByUser: async (userId: string) => {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { items: { include: { product: true } } },
    });
  },
  addItem: async (
    userId: string,
    { productId, quantidade = 1, tamanho = null, acabamento = null }: { productId: string; quantidade?: number; tamanho?: string | null; acabamento?: string | null },
  ) => {
    const cart = await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    // Chaves compostas do Prisma não aceitam null em lookups; normalizamos para '' só na busca.
    const tamanhoKey = tamanho ?? '';
    const acabamentoKey = acabamento ?? '';
    return prisma.cartItem.upsert({
      where: {
        cartId_productId_tamanho_acabamento: {
          cartId: cart.id,
          productId,
          tamanho: tamanhoKey,
          acabamento: acabamentoKey,
        },
      },
      update: { quantidade: { increment: quantidade } },
      create: { cartId: cart.id, productId, quantidade, tamanho: tamanhoKey, acabamento: acabamentoKey },
    });
  },
  findItem: (itemId: string) => prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } }),
  updateItem: (_userId: string, itemId: string, quantidade: number) =>
    prisma.cartItem.update({ where: { id: itemId }, data: { quantidade } }),
  removeItem: (_userId: string, itemId: string) => prisma.cartItem.delete({ where: { id: itemId } }).then(() => true),
  clear: async (userId: string) => {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return true;
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return true;
  },
};
