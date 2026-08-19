import { prisma } from '@/lib/prisma';
import { Prisma, PrismaClient } from '@prisma/client';

type Db = PrismaClient | Prisma.TransactionClient;

export type CartOwner = { userId: string } | { sessionId: string };

function ownerWhere(owner: CartOwner) {
  return 'userId' in owner ? { userId: owner.userId } : { sessionId: owner.sessionId };
}

export const cartRepo = {
  getByOwner: async (owner: CartOwner) => {
    return prisma.cart.upsert({
      where: ownerWhere(owner) as Prisma.CartWhereUniqueInput,
      update: {},
      create: owner,
      include: { items: { include: { product: true } } },
    });
  },
  findByOwner: (owner: CartOwner) =>
    prisma.cart.findUnique({
      where: ownerWhere(owner) as Prisma.CartWhereUniqueInput,
      include: { items: { include: { product: true } } },
    }),
  addItem: async (
    owner: CartOwner,
    { productId, quantidade = 1, tamanho = null }: { productId: string; quantidade?: number; tamanho?: string | null },
  ) => {
    const cart = await prisma.cart.upsert({ where: ownerWhere(owner) as Prisma.CartWhereUniqueInput, update: {}, create: owner });
    // Chaves compostas do Prisma não aceitam null em lookups; normalizamos para '' só na busca.
    const tamanhoKey = tamanho ?? '';
    return prisma.cartItem.upsert({
      where: {
        cartId_productId_tamanho: {
          cartId: cart.id,
          productId,
          tamanho: tamanhoKey,
        },
      },
      update: { quantidade: { increment: quantidade } },
      create: { cartId: cart.id, productId, quantidade, tamanho: tamanhoKey },
    });
  },
  findItem: (itemId: string) => prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } }),
  updateItem: (itemId: string, quantidade: number) =>
    prisma.cartItem.update({ where: { id: itemId }, data: { quantidade } }),
  removeItem: (itemId: string) => prisma.cartItem.delete({ where: { id: itemId } }).then(() => true),
  clear: async (owner: CartOwner, db: Db = prisma) => {
    const cart = await db.cart.findUnique({ where: ownerWhere(owner) as Prisma.CartWhereUniqueInput });
    if (!cart) return true;
    await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    return true;
  },
  /**
   * Recria os itens de um carrinho já limpo — usado para devolver a sacola ao
   * cliente quando o pedido é criado (e o carrinho já foi esvaziado na mesma
   * transação) mas a cobrança falha depois no gateway de pagamento.
   */
  restoreItems: async (
    owner: CartOwner,
    items: { productId: string; quantidade: number; tamanho: string | null }[],
    db: Db = prisma,
  ) => {
    const cart = await db.cart.upsert({ where: ownerWhere(owner) as Prisma.CartWhereUniqueInput, update: {}, create: owner });
    for (const item of items) {
      const tamanhoKey = item.tamanho ?? '';
      await db.cartItem.upsert({
        where: { cartId_productId_tamanho: { cartId: cart.id, productId: item.productId, tamanho: tamanhoKey } },
        update: { quantidade: { increment: item.quantidade } },
        create: { cartId: cart.id, productId: item.productId, quantidade: item.quantidade, tamanho: item.tamanho },
      });
    }
  },
  /** Move os itens do carrinho de sessão anônima para o carrinho do usuário recém-logado/cadastrado. */
  mergeSessionIntoUser: async (sessionId: string, userId: string) => {
    const guestCart = await prisma.cart.findUnique({ where: { sessionId }, include: { items: true } });
    if (!guestCart || guestCart.items.length === 0) return;

    const userCart = await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });

    for (const item of guestCart.items) {
      await prisma.cartItem.upsert({
        where: {
          cartId_productId_tamanho: {
            cartId: userCart.id,
            productId: item.productId,
            tamanho: item.tamanho ?? '',
          },
        },
        update: { quantidade: { increment: item.quantidade } },
        create: { cartId: userCart.id, productId: item.productId, quantidade: item.quantidade, tamanho: item.tamanho },
      });
    }

    await prisma.cart.delete({ where: { id: guestCart.id } });
  },
  findAbandoned: (olderThanHours: number) => {
    const threshold = new Date(Date.now() - olderThanHours * 60 * 60000);
    return prisma.cart.findMany({
      where: {
        updatedAt: { lt: threshold },
        abandonedEmailSentAt: null,
        userId: { not: null },
        items: { some: {} },
      },
      include: { items: { include: { product: true } }, user: { select: { id: true, nome: true, email: true } } },
    });
  },
  markAbandonedEmailSent: (id: string) =>
    prisma.cart.update({ where: { id }, data: { abandonedEmailSentAt: new Date() } }),
};
