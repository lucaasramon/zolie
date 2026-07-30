/**
 * >>> POSTGRES <<< Implementação Prisma de Address.
 * Mesma interface do repositório em memória. Ativa quando DATA_SOURCE=prisma
 * e o bloco de src/database/prismaClient.js estiver descomentado.
 */
const { prisma } = require('../../database/prismaClient');

module.exports = {
  listByUser: userId => prisma.address.findMany({ where: { userId }, orderBy: { principal: 'desc' } }),
  findById: id => prisma.address.findUnique({ where: { id } }),
  create: async (userId, data) => {
    if (data.principal) await prisma.address.updateMany({ where: { userId }, data: { principal: false } });
    return prisma.address.create({ data: { ...data, userId } });
  },
  update: (id, data) => prisma.address.update({ where: { id }, data }),
  remove: id => prisma.address.delete({ where: { id } }).then(() => true)
};
