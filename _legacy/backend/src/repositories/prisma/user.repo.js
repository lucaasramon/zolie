/**
 * >>> POSTGRES <<< Implementação Prisma de User.
 * Mesma interface do repositório em memória. Ativa quando DATA_SOURCE=prisma
 * e o bloco de src/database/prismaClient.js estiver descomentado.
 */
const { prisma } = require('../../database/prismaClient');

module.exports = {
  findByEmail: email => prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
  findById: id => prisma.user.findUnique({ where: { id } }),
  create: data => prisma.user.create({ data: { ...data, email: data.email.toLowerCase() } }),
  update: (id, data) => prisma.user.update({ where: { id }, data }),
  countOrders: userId => prisma.order.count({ where: { userId } }),
  createResetToken: (userId, token, expiresAt) => prisma.passwordResetToken.create({ data: { userId, token, expiresAt } }),
  findResetToken: token => prisma.passwordResetToken.findFirst({ where: { token, usedAt: null, expiresAt: { gt: new Date() } } }),
  consumeResetToken: token => prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } })
};
