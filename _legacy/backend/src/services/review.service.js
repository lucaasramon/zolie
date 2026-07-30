const { repositories } = require('../repositories');
const { AppError, notFound } = require('../utils/errors');

async function list(productId, pagination) {
  const product = await repositories.products.findById(productId);
  if (!product) throw notFound('Produto');
  return repositories.reviews.listByProduct(productId, pagination);
}

async function create(userId, productId, { nota, titulo, comentario }) {
  const product = await repositories.products.findById(productId);
  if (!product) throw notFound('Produto');
  const existing = await repositories.reviews.findByUserAndProduct(userId, productId);
  if (existing) throw new AppError('Você já avaliou esta peça', 409, 'REVIEW_EXISTS');
  const review = await repositories.reviews.create({ userId, productId, nota, titulo, comentario, aprovado: false });
  return { review, mensagem: 'Avaliação enviada para moderação' };
}

async function aprovar(reviewId, productId) {
  await repositories.reviews.recalcProduct(productId);
  return { aprovado: true, reviewId };
}

module.exports = { list, create, aprovar };
