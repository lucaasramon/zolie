const { db } = require('../../database/memoryDb');
const { slugify } = require('../../utils/slug');

module.exports = {
  async list() {
    return db.categories
      .filter(c => c.ativa)
      .sort((a, b) => a.ordem - b.ordem)
      .map(c => Object.assign({}, c, { totalProdutos: db.products.filter(p => p.categoriaId === c.id && p.ativo).length }));
  },
  async findBySlug(slug) { return db.categories.find(c => c.slug === slug) || null; },
  async findById(id) { return db.categories.find(c => c.id === id) || null; },
  async create(data) {
    const cat = { id: db.newId(), nome: data.nome, slug: data.slug || slugify(data.nome), imagem: data.imagem || null, ordem: data.ordem ?? db.categories.length, ativa: true, createdAt: new Date() };
    db.categories.push(cat);
    return cat;
  },
  async update(id, data) {
    const c = db.categories.find(x => x.id === id);
    if (!c) return null;
    Object.assign(c, data);
    return c;
  },
  async remove(id) {
    const c = db.categories.find(x => x.id === id);
    if (!c) return false;
    c.ativa = false;
    return true;
  }
};
