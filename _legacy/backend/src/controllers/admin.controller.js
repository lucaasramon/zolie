const admin = require('../services/admin.service');
const { repositories } = require('../repositories');
const { parsePagination, meta } = require('../utils/pagination');

module.exports = {
  dashboard: async (req, res) => res.json({ data: await admin.dashboard() }),
  orders: async (req, res) => {
    const pagination = parsePagination(req.query);
    const { total, items } = await repositories.orders.listAll({ ...pagination, status: req.query.status });
    res.json({ data: items, meta: meta(total, pagination) });
  },
  banners: async (req, res) => res.json({ data: await repositories.banners.list() }),
  createBanner: async (req, res) => res.status(201).json({ data: await repositories.banners.create(req.body) }),
  updateBanner: async (req, res) => res.json({ data: await repositories.banners.update(req.params.id, req.body) }),
  removeBanner: async (req, res) => { await repositories.banners.remove(req.params.id); res.status(204).send(); }
};
