import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import type { Personalizacao } from '@/lib/personalizacao';

type Db = PrismaClient | Prisma.TransactionClient;

export type CartOwner = { userId: string } | { sessionId: string };

type PersonalizacaoJson = Prisma.InputJsonValue | typeof Prisma.DbNull;

/** Valor para a coluna Json: `DbNull` em vez de `null`, exigido pelo Prisma. */
function personalizacaoData(p: unknown): PersonalizacaoJson {
  return p == null ? Prisma.DbNull : (p as Prisma.InputJsonValue);
}

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
    {
      productId,
      quantidade = 1,
      tamanho = null,
      personalizacao = null,
    }: { productId: string; quantidade?: number; tamanho?: string | null; personalizacao?: Personalizacao | null },
  ) => {
    const cart = await prisma.cart.upsert({ where: ownerWhere(owner) as Prisma.CartWhereUniqueInput, update: {}, create: owner });
    // Chaves compostas do Prisma não aceitam null em lookups; normalizamos para '' só na busca.
    const tamanhoKey = tamanho ?? '';
    // Peça personalizada nunca soma com outra linha: cada uma tem suas próprias escolhas.
    const personalizacaoKey = personalizacao ? randomUUID() : '';
    return prisma.cartItem.upsert({
      where: {
        cartId_productId_tamanho_personalizacaoKey: {
          cartId: cart.id,
          productId,
          tamanho: tamanhoKey,
          personalizacaoKey,
        },
      },
      update: { quantidade: { increment: quantidade } },
      create: {
        cartId: cart.id,
        productId,
        quantidade,
        tamanho: tamanhoKey,
        personalizacao: personalizacaoData(personalizacao),
        personalizacaoKey,
      },
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
    items: { productId: string; quantidade: number; tamanho: string | null; personalizacao?: unknown; personalizacaoKey?: string }[],
    db: Db = prisma,
  ) => {
    const cart = await db.cart.upsert({ where: ownerWhere(owner) as Prisma.CartWhereUniqueInput, update: {}, create: owner });
    for (const item of items) {
      const tamanhoKey = item.tamanho ?? '';
      const personalizacaoKey = item.personalizacaoKey ?? '';
      await db.cartItem.upsert({
        where: {
          cartId_productId_tamanho_personalizacaoKey: { cartId: cart.id, productId: item.productId, tamanho: tamanhoKey, personalizacaoKey },
        },
        update: { quantidade: { increment: item.quantidade } },
        create: {
          cartId: cart.id,
          productId: item.productId,
          quantidade: item.quantidade,
          tamanho: item.tamanho,
          personalizacao: personalizacaoData(item.personalizacao),
          personalizacaoKey,
        },
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
          cartId_productId_tamanho_personalizacaoKey: {
            cartId: userCart.id,
            productId: item.productId,
            tamanho: item.tamanho ?? '',
            personalizacaoKey: item.personalizacaoKey,
          },
        },
        update: { quantidade: { increment: item.quantidade } },
        create: {
          cartId: userCart.id,
          productId: item.productId,
          quantidade: item.quantidade,
          tamanho: item.tamanho,
          personalizacao: personalizacaoData(item.personalizacao),
          personalizacaoKey: item.personalizacaoKey,
        },
      });
    }

    await prisma.cart.delete({ where: { id: guestCart.id } });
  },
  /**
   * Carrinhos parados há mais de `olderThanHours`, mas não mais velhos que
   * `maxAgeDays`: um lembrete de um carrinho de meses atrás não faz sentido
   * para a cliente e, depois de um tempo sem o cron rodar, viraria um disparo em massa.
   */
  findAbandoned: (olderThanHours: number, maxAgeDays = 7) => {
    const threshold = new Date(Date.now() - olderThanHours * 60 * 60000);
    const limiteAntigo = new Date(Date.now() - maxAgeDays * 24 * 60 * 60000);
    return prisma.cart.findMany({
      where: {
        updatedAt: { lt: threshold, gte: limiteAntigo },
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
