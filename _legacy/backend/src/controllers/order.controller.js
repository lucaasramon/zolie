const orderService = require('../services/order.service');
const { parsePagination, meta } = require('../utils/pagination');

module.exports = {
  create: async (req, res) => res.status(201).json({ data: await orderService.create(req.user.sub, req.body) }),
  listMine: async (req, res) => {
    const pagination = parsePagination(req.query);
    const { total, items } = await orderService.listMine(req.user.sub, pagination);
    res.json({ data: items, meta: meta(total, pagination) });
  },
  detail: async (req, res) => res.json({
    data: await orderService.detail(req.user.sub, req.params.id, req.user.role === 'ADMIN')
  }),
  updateStatus: async (req, res) => res.json({
    data: await orderService.updateStatus(req.params.id, req.body.status, req.body.descricao)
  })
};
