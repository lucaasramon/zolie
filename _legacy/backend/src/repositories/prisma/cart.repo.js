/**
 * >>> POSTGRES <<< Implementação Prisma de Cart.
 * Mesma interface do repositório em memória. Ativa quando DATA_SOURCE=prisma
 * e o bloco de src/database/prismaClient.js estiver descomentado.
 */
const { prisma } = require('../../database/prismaClient');

module.exports = {
  getByUser: async userId => {
    const cart = await prisma.cart.upsert({
      where: { userId }, update: {}, create: { userId },
      include: { items: { include: { product: true } } }
    });
    return cart;
  },
  addItem: async (userId, { productId, quantidade = 1, tamanho = null, acabamento = null }) => {
    const cart = await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    return prisma.cartItem.upsert({
      where: { cartId_productId_tamanho_acabamento: { cartId: cart.id, productId, tamanho, acabamento } },
      update: { quantidade: { increment: quantidade } },
      create: { cartId: cart.id, productId, quantidade, tamanho, acabamento }
    });
  },
  updateItem: (userId, itemId, quantidade) => prisma.cartItem.update({ where: { id: itemId }, data: { quantidade } }),
  removeItem: (userId, itemId) => prisma.cartItem.delete({ where: { id: itemId } }).then(() => true),
  clear: async userId => {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return true;
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return true;
  }
};
