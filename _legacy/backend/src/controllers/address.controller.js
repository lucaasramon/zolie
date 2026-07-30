const { repositories } = require('../repositories');
const { notFound, forbidden } = require('../utils/errors');

const owned = async (id, userId) => {
  const a = await repositories.addresses.findById(id);
  if (!a) throw notFound('Endereço');
  if (a.userId !== userId) throw forbidden();
  return a;
};

module.exports = {
  list: async (req, res) => res.json({ data: await repositories.addresses.listByUser(req.user.sub) }),
  create: async (req, res) => res.status(201).json({ data: await repositories.addresses.create(req.user.sub, req.body) }),
  update: async (req, res) => {
    await owned(req.params.id, req.user.sub);
    res.json({ data: await repositories.addresses.update(req.params.id, req.body) });
  },
  remove: async (req, res) => {
    await owned(req.params.id, req.user.sub);
    await repositories.addresses.remove(req.params.id);
    res.status(204).send();
  }
};
