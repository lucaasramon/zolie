const { db } = require('../../database/memoryDb');

module.exports = {
  async listByUser(userId) {
    return db.wishlistItems
      .filter(w => w.userId === userId)
      .map(w => ({ ...w, product: db.products.find(p => p.id === w.productId) || null }));
  },
  async add(userId, productId) {
    const found = db.wishlistItems.find(w => w.userId === userId && w.productId === productId);
    if (found) return found;
    const item = { id: db.newId(), userId, productId, createdAt: new Date() };
    db.wishlistItems.push(item);
    return item;
  },
  async remove(userId, productId) {
    const i = db.wishlistItems.findIndex(w => w.userId === userId && w.productId === productId);
    if (i < 0) return false;
    db.wishlistItems.splice(i, 1);
    return true;
  }
};
