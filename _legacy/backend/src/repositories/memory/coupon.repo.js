const { db } = require('../../database/memoryDb');

module.exports = {
  async list() { return db.coupons; },
  async findByCode(codigo) {
    return db.coupons.find(c => c.codigo === String(codigo).toUpperCase()) || null;
  },
  async create(data) {
    const c = Object.assign({ id: db.newId(), usos: 0, ativo: true, createdAt: new Date() }, data, { codigo: String(data.codigo).toUpperCase() });
    db.coupons.push(c);
    return c;
  },
  async update(id, data) {
    const c = db.coupons.find(x => x.id === id);
    if (!c) return null;
    Object.assign(c, data);
    return c;
  },
  async remove(id) {
    const c = db.coupons.find(x => x.id === id);
    if (!c) return false;
    c.ativo = false;
    return true;
  },
  async incrementUse(id) {
    const c = db.coupons.find(x => x.id === id);
    if (c) c.usos += 1;
    return c || null;
  }
};
