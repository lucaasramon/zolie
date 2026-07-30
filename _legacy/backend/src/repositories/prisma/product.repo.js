/**
 * >>> POSTGRES <<< Implementação Prisma de Product.
 * Mesma interface do repositório em memória. Ativa quando DATA_SOURCE=prisma
 * e o bloco de src/database/prismaClient.js estiver descomentado.
 */
const { prisma } = require('../../database/prismaClient');

module.exports = {
  search: async (filters = {}, sort = 'relevancia', { skip = 0, take = 12 } = {}) => {
    const where = { ativo: true };
    if (filters.q) where.OR = [
      { nome: { contains: filters.q, mode: 'insensitive' } },
      { descricao: { contains: filters.q, mode: 'insensitive' } }
    ];
    if (filters.categoria) where.categoria = { slug: filters.categoria };
    if (filters.material) where.material = filters.material;
    if (filters.pedra) where.pedra = filters.pedra;
    if (filters.tamanho) where.tamanhos = { has: filters.tamanho };
    if (filters.notaMin) where.notaMedia = { gte: Number(filters.notaMin) };
    if (filters.destaque) where.destaque = true;
    if (filters.lancamento) where.lancamento = true;
    if (filters.promocao) where.precoPromocional = { not: null };
    if (filters.precoMin != null || filters.precoMax != null) {
      where.preco = {};
      if (filters.precoMin != null) where.preco.gte = Number(filters.precoMin);
      if (filters.precoMax != null) where.preco.lte = Number(filters.precoMax);
    }
    const orderBy = {
      menor_preco: { preco: 'asc' },
      maior_preco: { preco: 'desc' },
      mais_vendidos: { totalAvaliacoes: 'desc' },
      lancamentos: { createdAt: 'desc' },
      melhor_avaliados: { notaMedia: 'desc' },
      relevancia: [{ destaque: 'desc' }, { totalAvaliacoes: 'desc' }]
    }[sort] || [{ destaque: 'desc' }];

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, orderBy, skip, take, include: { categoria: true } })
    ]);
    return { total, items };
  },
  findBySlug: slug => prisma.product.findFirst({ where: { slug, ativo: true }, include: { categoria: true } }),
  findById: id => prisma.product.findUnique({ where: { id }, include: { categoria: true } }),
  findManyByIds: ids => prisma.product.findMany({ where: { id: { in: ids } }, include: { categoria: true } }),
  create: data => prisma.product.create({ data }),
  update: (id, data) => prisma.product.update({ where: { id }, data }),
  remove: id => prisma.product.update({ where: { id }, data: { ativo: false } }).then(() => true),
  decrementStock: (id, qtd) => prisma.product.update({ where: { id }, data: { estoque: { decrement: qtd } } })
};
