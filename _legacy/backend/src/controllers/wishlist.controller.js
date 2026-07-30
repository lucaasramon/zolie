const wishlist = require('../services/wishlist.service');

module.exports = {
  list: async (req, res) => res.json({ data: await wishlist.list(req.user.sub) }),
  add: async (req, res) => res.status(201).json({ data: await wishlist.add(req.user.sub, req.params.productId) }),
  remove: async (req, res) => res.json({ data: await wishlist.remove(req.user.sub, req.params.productId) })
};
