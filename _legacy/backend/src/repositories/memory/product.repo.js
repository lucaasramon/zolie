const { db } = require('../../database/memoryDb');
const { slugify } = require('../../utils/slug');

const withCategory = p => Object.assign({}, p, { categoria: db.categories.find(c => c.id === p.categoriaId) || null });

module.exports = {
  /**
   * filters: { q, categoria, material, precoMin, precoMax, pedra, tamanho, notaMin, destaque, lancamento, promocao }
   * sort: relevancia | menor_preco | maior_preco | mais_vendidos | lancamentos | melhor_avaliados
   */
  async search(filters = {}, sort = 'relevancia', { skip = 0, take = 12 } = {}) {
    let list = db.products.filter(p => p.ativo);
    const f = filters;
    if (f.q) {
      const q = String(f.q).toLowerCase();
      list = list.filter(p => (p.nome + ' ' + p.descricao).toLowerCase().includes(q));
    }
    if (f.categoria) {
      const cat = db.categories.find(c => c.slug === f.categoria || c.id === f.categoria);
      list = cat ? list.filter(p => p.categoriaId === cat.id) : [];
    }
    if (f.material) list = list.filter(p => p.material === f.material);
    if (f.pedra) list = list.filter(p => p.pedra === f.pedra);
    if (f.tamanho) list = list.filter(p => p.tamanhos.includes(f.tamanho));
    if (f.notaMin) list = list.filter(p => p.notaMedia >= Number(f.notaMin));
    if (f.destaque) list = list.filter(p => p.destaque);
    if (f.lancamento) list = list.filter(p => p.lancamento);
    if (f.promocao) list = list.filter(p => p.precoPromocional != null);
    const efetivo = p => p.precoPromocional ?? p.preco;
    if (f.precoMin != null) list = list.filter(p => efetivo(p) >= Number(f.precoMin));
    if (f.precoMax != null) list = list.filter(p => efetivo(p) <= Number(f.precoMax));

    const sorters = {
      menor_preco: (a, b) => efetivo(a) - efetivo(b),
      maior_preco: (a, b) => efetivo(b) - efetivo(a),
      mais_vendidos: (a, b) => b.totalAvaliacoes - a.totalAvaliacoes,
      lancamentos: (a, b) => Number(b.lancamento) - Number(a.lancamento) || b.createdAt - a.createdAt,
      melhor_avaliados: (a, b) => b.notaMedia - a.notaMedia,
      relevancia: (a, b) => Number(b.destaque) - Number(a.destaque) || b.totalAvaliacoes - a.totalAvaliacoes
    };
    list = list.slice().sort(sorters[sort] || sorters.relevancia);

    return { total: list.length, items: list.slice(skip, skip + take).map(withCategory) };
  },
  async findBySlug(slug) {
    const p = db.products.find(x => x.slug === slug && x.ativo);
    return p ? withCategory(p) : null;
  },
  async findById(id) {
    const p = db.products.find(x => x.id === id);
    return p ? withCategory(p) : null;
  },
  async findManyByIds(ids) { return db.products.filter(p => ids.includes(p.id)).map(withCategory); },
  async create(data) {
    const p = Object.assign({
      id: db.newId(), slug: slugify(data.nome), estoque: 0, imagens: [], tamanhos: [],
      destaque: false, lancamento: false, ativo: true, notaMedia: 0, totalAvaliacoes: 0,
      createdAt: new Date(), updatedAt: new Date()
    }, data);
    db.products.push(p);
    return withCategory(p);
  },
  async update(id, data) {
    const p = db.products.find(x => x.id === id);
    if (!p) return null;
    Object.assign(p, data, { updatedAt: new Date() });
    return withCategory(p);
  },
  async remove(id) {
    const p = db.products.find(x => x.id === id);
    if (!p) return false;
    p.ativo = false;
    return true;
  },
  async decrementStock(id, qtd) {
    const p = db.products.find(x => x.id === id);
    if (!p) return null;
    p.estoque = Math.max(0, p.estoque - qtd);
    return p;
  }
};
