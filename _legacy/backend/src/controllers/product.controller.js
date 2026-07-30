const productService = require('../services/product.service');
const { parsePagination, meta } = require('../utils/pagination');

module.exports = {
  list: async (req, res) => {
    const pagination = parsePagination(req.query);
    const filters = {
      q: req.query.q, categoria: req.query.categoria, material: req.query.material,
      pedra: req.query.pedra, tamanho: req.query.tamanho, notaMin: req.query.notaMin,
      precoMin: req.query.precoMin, precoMax: req.query.precoMax,
      destaque: req.query.destaque === 'true', lancamento: req.query.lancamento === 'true',
      promocao: req.query.promocao === 'true'
    };
    const { total, items } = await productService.list(filters, req.query.sort, pagination);
    res.json({ data: items, meta: meta(total, pagination) });
  },
  detail: async (req, res) => res.json({ data: await productService.bySlug(req.params.slug) }),
  create: async (req, res) => res.status(201).json({ data: await productService.create(req.body) }),
  update: async (req, res) => res.json({ data: await productService.update(req.params.id, req.body) }),
  remove: async (req, res) => { await productService.remove(req.params.id); res.status(204).send(); }
};
