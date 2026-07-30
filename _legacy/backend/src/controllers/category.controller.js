const { repositories } = require('../repositories');
const { notFound } = require('../utils/errors');

module.exports = {
  list: async (req, res) => res.json({ data: await repositories.categories.list() }),
  create: async (req, res) => res.status(201).json({ data: await repositories.categories.create(req.body) }),
  update: async (req, res) => {
    const c = await repositories.categories.update(req.params.id, req.body);
    if (!c) throw notFound('Categoria');
    res.json({ data: c });
  },
  remove: async (req, res) => { await repositories.categories.remove(req.params.id); res.status(204).send(); }
};
