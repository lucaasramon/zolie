const { db } = require('../../database/memoryDb');

module.exports = {
  async listByProduct(productId, { skip = 0, take = 10 } = {}) {
    const all = db.productReviews.filter(r => r.productId === productId && r.aprovado)
      .sort((a, b) => b.createdAt - a.createdAt);
    return { total: all.length, items: all.slice(skip, skip + take) };
  },
  async create(data) {
    const r = Object.assign({ id: db.newId(), aprovado: false, createdAt: new Date() }, data);
    db.productReviews.push(r);
    return r;
  },
  async findByUserAndProduct(userId, productId) {
    return db.productReviews.find(r => r.userId === userId && r.productId === productId) || null;
  },
  async recalcProduct(productId) {
    const rs = db.productReviews.filter(r => r.productId === productId && r.aprovado);
    const p = db.products.find(x => x.id === productId);
    if (!p) return null;
    p.totalAvaliacoes = rs.length;
    p.notaMedia = rs.length ? Math.round((rs.reduce((a, r) => a + r.nota, 0) / rs.length) * 10) / 10 : 0;
    return p;
  }
};
