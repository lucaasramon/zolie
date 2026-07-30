const { repositories } = require('../repositories');
const coupons = require('../services/coupon.service');
const { notFound } = require('../utils/errors');

module.exports = {
  validate: async (req, res) => {
    const r = await coupons.validar(req.body.codigo, {
      subtotal: Number(req.body.subtotal || 0),
      userId: req.user ? req.user.sub : null
    });
    res.json({ data: { codigo: r.cupom.codigo, descricao: r.cupom.descricao, desconto: r.desconto, freteGratis: r.freteGratis } });
  },
  list: async (req, res) => res.json({ data: await repositories.coupons.list() }),
  create: async (req, res) => res.status(201).json({ data: await repositories.coupons.create(req.body) }),
  update: async (req, res) => {
    const c = await repositories.coupons.update(req.params.id, req.body);
    if (!c) throw notFound('Cupom');
    res.json({ data: c });
  },
  remove: async (req, res) => { await repositories.coupons.remove(req.params.id); res.status(204).send(); }
};
