const { db } = require('../../database/memoryDb');

const hydrate = o => ({
  ...o,
  items: db.orderItems.filter(i => i.orderId === o.id),
  events: db.orderEvents.filter(e => e.orderId === o.id).sort((a, b) => a.createdAt - b.createdAt),
  endereco: db.addresses.find(a => a.id === o.enderecoId) || null
});

module.exports = {
  async create(order, items) {
    const created = { id: db.newId(), createdAt: new Date(), updatedAt: new Date(), ...order };
    db.orders.push(created);
    items.forEach(i => db.orderItems.push({ id: db.newId(), orderId: created.id, ...i }));
    db.orderEvents.push({ id: db.newId(), orderId: created.id, status: created.status, descricao: 'Pedido criado', createdAt: new Date() });
    return hydrate(created);
  },
  async listByUser(userId, { skip = 0, take = 10 } = {}) {
    const all = db.orders.filter(o => o.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
    return { total: all.length, items: all.slice(skip, skip + take).map(hydrate) };
  },
  async listAll({ skip = 0, take = 20, status } = {}) {
    let all = db.orders.slice().sort((a, b) => b.createdAt - a.createdAt);
    if (status) all = all.filter(o => o.status === status);
    return { total: all.length, items: all.slice(skip, skip + take).map(hydrate) };
  },
  async findById(id) {
    const o = db.orders.find(x => x.id === id);
    return o ? hydrate(o) : null;
  },
  async updateStatus(id, status, descricao) {
    const o = db.orders.find(x => x.id === id);
    if (!o) return null;
    o.status = status;
    o.updatedAt = new Date();
    db.orderEvents.push({ id: db.newId(), orderId: id, status, descricao: descricao || null, createdAt: new Date() });
    return hydrate(o);
  },
  async nextNumber() { return 'ZL-' + String(2495 + db.orders.length); },
  async salesSummary() {
    const paid = db.orders.filter(o => o.status !== 'CANCELADO');
    const total = paid.reduce((a, o) => a + o.total, 0);
    return {
      pedidos: paid.length,
      faturamento: Math.round(total * 100) / 100,
      ticketMedio: paid.length ? Math.round((total / paid.length) * 100) / 100 : 0
    };
  }
};
