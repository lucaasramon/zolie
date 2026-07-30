/**
 * Fábrica de repositórios. Services só conhecem esta interface — trocar a fonte de dados
 * é mudar DATA_SOURCE no .env, nada mais.
 *
 * >>> POSTGRES <<< quando o banco existir: DATA_SOURCE=prisma
 */
const { env } = require('../config/env');

const memory = {
  users: require('./memory/user.repo'),
  addresses: require('./memory/address.repo'),
  categories: require('./memory/category.repo'),
  products: require('./memory/product.repo'),
  reviews: require('./memory/review.repo'),
  carts: require('./memory/cart.repo'),
  orders: require('./memory/order.repo'),
  coupons: require('./memory/coupon.repo'),
  wishlist: require('./memory/wishlist.repo'),
  banners: require('./memory/banner.repo')
};

const prisma = {
  users: require('./prisma/user.repo'),
  addresses: require('./prisma/address.repo'),
  categories: require('./prisma/category.repo'),
  products: require('./prisma/product.repo'),
  reviews: require('./prisma/review.repo'),
  carts: require('./prisma/cart.repo'),
  orders: require('./prisma/order.repo'),
  coupons: require('./prisma/coupon.repo'),
  wishlist: require('./prisma/wishlist.repo'),
  banners: require('./prisma/banner.repo')
};

const repositories = env.dataSource === 'prisma' ? prisma : memory;

module.exports = { repositories, dataSource: env.dataSource };
