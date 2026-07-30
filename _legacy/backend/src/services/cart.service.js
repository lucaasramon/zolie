const { repositories } = require('../repositories');
const { AppError, notFound } = require('../utils/errors');
const pricing = require('./pricing.service');
const shipping = require('./shipping.service');
const coupons = require('./coupon.service');

async function get(userId, { cep, cupom } = {}) {
  const cart = await repositories.carts.getByUser(userId);
  const items = cart.items.filter(i => i.product);
  let frete = 0;
  let cotacao = null;
  if (cep) {
    const subtotalBruto = pricing.resumo(items).subtotal;
    cotacao = await shipping.cotar(cep, subtotalBruto);
    frete = cotacao.opcoes[0].valor;
  }
  let desconto = 0;
  let cupomAplicado = null;
  if (cupom) {
    const subtotalBruto = pricing.resumo(items).subtotal;
    const r = await coupons.validar(cupom, { subtotal: subtotalBruto, userId, frete });
    desconto = r.desconto;
    if (r.freteGratis) frete = 0;
    cupomAplicado = { codigo: r.cupom.codigo, descricao: r.cupom.descricao };
  }
  return {
    id: cart.id,
    items: items.map(i => ({
      id: i.id, productId: i.productId, nome: i.product.nome, slug: i.product.slug,
      imagem: (i.product.imagens || [])[0] || null,
      material: i.product.material, tamanho: i.tamanho, acabamento: i.acabamento,
      quantidade: i.quantidade,
      precoUnitario: pricing.precoEfetivo(i.product),
      subtotal: pricing.precoEfetivo(i.product) * i.quantidade
    })),
    cotacaoFrete: cotacao,
    cupom: cupomAplicado,
    resumo: pricing.resumo(items, { frete, desconto })
  };
}

async function addItem(userId, payload) {
  const product = await repositories.products.findById(payload.productId);
  if (!product) throw notFound('Produto');
  if (product.estoque < payload.quantidade) throw new AppError('Estoque insuficiente para esta peça', 422, 'OUT_OF_STOCK');
  await repositories.carts.addItem(userId, payload);
  return get(userId);
}

async function updateItem(userId, itemId, quantidade) {
  const updated = await repositories.carts.updateItem(userId, itemId, quantidade);
  if (!updated) throw notFound('Item do carrinho');
  return get(userId);
}

async function removeItem(userId, itemId) {
  const ok = await repositories.carts.removeItem(userId, itemId);
  if (!ok) throw notFound('Item do carrinho');
  return get(userId);
}

const clear = userId => repositories.carts.clear(userId);

module.exports = { get, addItem, updateItem, removeItem, clear };
