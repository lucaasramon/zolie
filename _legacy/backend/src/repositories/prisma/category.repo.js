/**
 * >>> POSTGRES <<< Implementação Prisma de Category.
 * Mesma interface do repositório em memória. Ativa quando DATA_SOURCE=prisma
 * e o bloco de src/database/prismaClient.js estiver descomentado.
 */
const { prisma } = require('../../database/prismaClient');

module.exports = {
  list: () => prisma.category.findMany({
    where: { ativa: true }, orderBy: { ordem: 'asc' },
    include: { _count: { select: { products: true } } }
  }),
  findBySlug: slug => prisma.category.findUnique({ where: { slug } }),
  findById: id => prisma.category.findUnique({ where: { id } }),
  create: data => prisma.category.create({ data }),
  update: (id, data) => prisma.category.update({ where: { id }, data }),
  remove: id => prisma.category.update({ where: { id }, data: { ativa: false } }).then(() => true)
};
