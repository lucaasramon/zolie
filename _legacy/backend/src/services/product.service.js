const { repositories } = require('../repositories');
const { notFound } = require('../utils/errors');
const { precoEfetivo } = require('./pricing.service');
const { env } = require('../config/env');
const { round } = require('../utils/money');

const decorate = p => {
  const preco = precoEfetivo(p);
  return {
    ...p,
    precoEfetivo: preco,
    temDesconto: p.precoPromocional != null,
    percentualDesconto: p.precoPromocional != null ? Math.round((1 - p.precoPromocional / p.preco) * 100) : 0,
    precoPix: round(preco * (1 - env.business.pixDiscountPercent / 100)),
    parcela: round(preco / env.business.maxInstallments),
    maxParcelas: env.business.maxInstallments,
    estoqueBaixo: p.estoque > 0 && p.estoque <= 8,
    disponivel: p.estoque > 0
  };
};

async function list(filters, sort, pagination) {
  const { total, items } = await repositories.products.search(filters, sort, pagination);
  return { total, items: items.map(decorate) };
}

async function bySlug(slug) {
  const p = await repositories.products.findBySlug(slug);
  if (!p) throw notFound('Produto');
  const relacionados = await repositories.products.search({ categoria: p.categoria ? p.categoria.slug : undefined }, 'relevancia', { skip: 0, take: 7 });
  return {
    ...decorate(p),
    relacionados: relacionados.items.filter(r => r.id !== p.id).slice(0, 6).map(decorate)
  };
}

const create = data => repositories.products.create(data).then(decorate);
const update = (id, data) => repositories.products.update(id, data).then(p => { if (!p) throw notFound('Produto'); return decorate(p); });
const remove = id => repositories.products.remove(id);

module.exports = { list, bySlug, create, update, remove, decorate };
