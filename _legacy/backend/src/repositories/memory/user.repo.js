const { db } = require('../../database/memoryDb');

module.exports = {
  async findByEmail(email) { return db.users.find(u => u.email === email.toLowerCase()) || null; },
  async findById(id) { return db.users.find(u => u.id === id) || null; },
  async create(data) {
    const user = {
      id: db.newId(), nome: data.nome, email: data.email.toLowerCase(), senhaHash: data.senhaHash,
      telefone: data.telefone || null, cpf: data.cpf || null, role: data.role || 'CUSTOMER',
      emailVerified: false, createdAt: new Date(), updatedAt: new Date()
    };
    db.users.push(user);
    return user;
  },
  async update(id, data) {
    const u = db.users.find(x => x.id === id);
    if (!u) return null;
    Object.assign(u, data, { updatedAt: new Date() });
    return u;
  },
  async countOrders(userId) { return db.orders.filter(o => o.userId === userId).length; },
  async createResetToken(userId, token, expiresAt) {
    const t = { id: db.newId(), userId, token, expiresAt, usedAt: null, createdAt: new Date() };
    db.passwordResetTokens.push(t);
    return t;
  },
  async findResetToken(token) {
    return db.passwordResetTokens.find(t => t.token === token && !t.usedAt && t.expiresAt > new Date()) || null;
  },
  async consumeResetToken(token) {
    const t = db.passwordResetTokens.find(x => x.token === token);
    if (t) t.usedAt = new Date();
    return t || null;
  }
};
