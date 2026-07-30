const { Router } = require('express');
const c = require('../controllers/address.controller');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const { authRequired } = require('../middlewares/auth');
const s = require('./schemas');

const r = Router();
r.use(authRequired);
r.get('/', asyncHandler(c.list));
r.post('/', validate({ body: s.addressSchema }), asyncHandler(c.create));
r.put('/:id', validate({ body: s.addressSchema.partial() }), asyncHandler(c.update));
r.delete('/:id', asyncHandler(c.remove));

module.exports = r;
