const { Router } = require('express');
const c = require('../controllers/order.controller');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const { authRequired, adminRequired } = require('../middlewares/auth');
const s = require('./schemas');

const r = Router();
r.use(authRequired);
r.post('/', validate({ body: s.orderSchema }), asyncHandler(c.create));
r.get('/', asyncHandler(c.listMine));
r.get('/:id', asyncHandler(c.detail));
r.patch('/:id/status', adminRequired, validate({ body: s.statusSchema }), asyncHandler(c.updateStatus));

module.exports = r;
