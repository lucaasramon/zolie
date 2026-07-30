const cartService = require('../services/cart.service');
const shipping = require('../services/shipping.service');
const coupons = require('../services/coupon.service');

module.exports = {
  get: async (req, res) => res.json({ data: await cartService.get(req.user.sub, { cep: req.query.cep, cupom: req.query.cupom }) }),
  addItem: async (req, res) => res.status(201).json({ data: await cartService.addItem(req.user.sub, req.body) }),
  updateItem: async (req, res) => res.json({ data: await cartService.updateItem(req.user.sub, req.params.id, req.body.quantidade) }),
  removeItem: async (req, res) => res.json({ data: await cartService.removeItem(req.user.sub, req.params.id) }),
  shipping: async (req, res) => {
    const cart = await cartService.get(req.user.sub);
    res.json({ data: await shipping.cotar(req.body.cep, cart.resumo.subtotal) });
  },
  coupon: async (req, res) => {
    const cart = await cartService.get(req.user.sub);
    const r = await coupons.validar(req.body.codigo, { subtotal: cart.resumo.subtotal, userId: req.user.sub });
    res.json({ data: { codigo: r.cupom.codigo, descricao: r.cupom.descricao, desconto: r.desconto, freteGratis: r.freteGratis } });
  }
};
