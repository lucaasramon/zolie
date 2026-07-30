const { repositories } = require('../repositories');
const { notFound } = require('../utils/errors');
const { decorate } = require('./product.service');

async function list(userId) {
  const items = await repositories.wishlist.listByUser(userId);
  return items.filter(i => i.product).map(i => decorate(i.product));
}

async function add(userId, productId) {
  const product = await repositories.products.findById(productId);
  if (!product) throw notFound('Produto');
  await repositories.wishlist.add(userId, productId);
  return list(userId);
}

async function remove(userId, productId) {
  await repositories.wishlist.remove(userId, productId);
  return list(userId);
}

module.exports = { list, add, remove };
