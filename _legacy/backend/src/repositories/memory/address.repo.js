const { db } = require('../../database/memoryDb');

module.exports = {
  async listByUser(userId) { return db.addresses.filter(a => a.userId === userId); },
  async findById(id) { return db.addresses.find(a => a.id === id) || null; },
  async create(userId, data) {
    if (data.principal) db.addresses.filter(a => a.userId === userId).forEach(a => { a.principal = false; });
    const address = Object.assign({ id: db.newId(), userId, createdAt: new Date() }, data);
    db.addresses.push(address);
    return address;
  },
  async update(id, data) {
    const a = db.addresses.find(x => x.id === id);
    if (!a) return null;
    if (data.principal) db.addresses.filter(x => x.userId === a.userId).forEach(x => { x.principal = false; });
    Object.assign(a, data);
    return a;
  },
  async remove(id) {
    const i = db.addresses.findIndex(a => a.id === id);
    if (i < 0) return false;
    db.addresses.splice(i, 1);
    return true;
  }
};
