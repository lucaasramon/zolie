/**
 * >>> POSTGRES <<< Implementação Prisma de Coupon.
 * Mesma interface do repositório em memória. Ativa quando DATA_SOURCE=prisma
 * e o bloco de src/database/prismaClient.js estiver descomentado.
 */
const { prisma } = require('../../database/prismaClient');

module.exports = {
  list: () => prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } }),
  findByCode: codigo => prisma.coupon.findUnique({ where: { codigo: String(codigo).toUpperCase() } }),
  create: data => prisma.coupon.create({ data: { ...data, codigo: String(data.codigo).toUpperCase() } }),
  update: (id, data) => prisma.coupon.update({ where: { id }, data }),
  remove: id => prisma.coupon.update({ where: { id }, data: { ativo: false } }).then(() => true),
  incrementUse: id => prisma.coupon.update({ where: { id }, data: { usos: { increment: 1 } } })
};
