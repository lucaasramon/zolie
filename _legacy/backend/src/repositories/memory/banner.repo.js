const { db } = require('../../database/memoryDb');

module.exports = {
  async list() { return db.banners.filter(b => b.ativo).sort((a, b) => a.ordem - b.ordem); },
  async create(data) {
    const b = Object.assign({ id: db.newId(), ordem: db.banners.length, ativo: true, createdAt: new Date() }, data);
    db.banners.push(b);
    return b;
  },
  async update(id, data) {
    const b = db.banners.find(x => x.id === id);
    if (!b) return null;
    Object.assign(b, data);
    return b;
  },
  async remove(id) {
    const b = db.banners.find(x => x.id === id);
    if (!b) return false;
    b.ativo = false;
    return true;
  }
};
