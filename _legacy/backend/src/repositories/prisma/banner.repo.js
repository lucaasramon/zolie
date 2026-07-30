/**
 * >>> POSTGRES <<< Implementação Prisma de Banner.
 * Mesma interface do repositório em memória. Ativa quando DATA_SOURCE=prisma
 * e o bloco de src/database/prismaClient.js estiver descomentado.
 */
const { prisma } = require('../../database/prismaClient');

module.exports = {
  list: () => prisma.banner.findMany({ where: { ativo: true }, orderBy: { ordem: 'asc' } }),
  create: data => prisma.banner.create({ data }),
  update: (id, data) => prisma.banner.update({ where: { id }, data }),
  remove: id => prisma.banner.update({ where: { id }, data: { ativo: false } }).then(() => true)
};
