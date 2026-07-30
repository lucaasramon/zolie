const reviewService = require('../services/review.service');
const { parsePagination, meta } = require('../utils/pagination');

module.exports = {
  list: async (req, res) => {
    const pagination = parsePagination(req.query);
    const { total, items } = await reviewService.list(req.params.id, pagination);
    res.json({ data: items, meta: meta(total, pagination) });
  },
  create: async (req, res) => res.status(201).json({ data: await reviewService.create(req.user.sub, req.params.id, req.body) })
};
