const { Router } = require('express');
const c = require('../controllers/coupon.controller');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const { authOptional, authRequired, adminRequired } = require('../middlewares/auth');
const s = require('./schemas');

const r = Router();
r.post('/validate', authOptional, validate({ body: s.couponCodeSchema }), asyncHandler(c.validate));
r.get('/', authRequired, adminRequired, asyncHandler(c.list));
r.post('/', authRequired, adminRequired, validate({ body: s.couponSchema }), asyncHandler(c.create));
r.put('/:id', authRequired, adminRequired, validate({ body: s.couponSchema.partial() }), asyncHandler(c.update));
r.delete('/:id', authRequired, adminRequired, asyncHandler(c.remove));

module.exports = r;
