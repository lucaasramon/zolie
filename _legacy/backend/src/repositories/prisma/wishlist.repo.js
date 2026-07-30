/**
 * >>> POSTGRES <<< Implementação Prisma de Wishlist.
 * Mesma interface do repositório em memória. Ativa quando DATA_SOURCE=prisma
 * e o bloco de src/database/prismaClient.js estiver descomentado.
 */
const { prisma } = require('../../database/prismaClient');

module.exports = {
  listByUser: userId => prisma.wishlistItem.findMany({ where: { userId }, include: { product: true } }),
  add: (userId, productId) => prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } }, update: {}, create: { userId, productId }
  }),
  remove: (userId, productId) => prisma.wishlistItem.delete({ where: { userId_productId: { userId, productId } } }).then(() => true)
};
