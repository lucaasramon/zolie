const { db } = require('../../database/memoryDb');

const ensureCart = userId => {
  let cart = db.carts.find(c => c.userId === userId);
  if (!cart) {
    cart = { id: db.newId(), userId, createdAt: new Date(), updatedAt: new Date() };
    db.carts.push(cart);
  }
  return cart;
};

module.exports = {
  async getByUser(userId) {
    const cart = ensureCart(userId);
    const items = db.cartItems.filter(i => i.cartId === cart.id).map(i => ({
      ...i, product: db.products.find(p => p.id === i.productId) || null
    }));
    return { ...cart, items };
  },
  async addItem(userId, { productId, quantidade = 1, tamanho = null, acabamento = null }) {
    const cart = ensureCart(userId);
    const existing = db.cartItems.find(i =>
      i.cartId === cart.id && i.productId === productId && i.tamanho === tamanho && i.acabamento === acabamento);
    if (existing) {
      existing.quantidade += quantidade;
      return existing;
    }
    const item = { id: db.newId(), cartId: cart.id, productId, quantidade, tamanho, acabamento };
    db.cartItems.push(item);
    return item;
  },
  async updateItem(userId, itemId, quantidade) {
    const cart = ensureCart(userId);
    const item = db.cartItems.find(i => i.id === itemId && i.cartId === cart.id);
    if (!item) return null;
    item.quantidade = Math.max(1, quantidade);
    return item;
  },
  async removeItem(userId, itemId) {
    const cart = ensureCart(userId);
    const i = db.cartItems.findIndex(x => x.id === itemId && x.cartId === cart.id);
    if (i < 0) return false;
    db.cartItems.splice(i, 1);
    return true;
  },
  async clear(userId) {
    const cart = ensureCart(userId);
    db.cartItems = db.cartItems.filter(i => i.cartId !== cart.id);
    return true;
  }
};
