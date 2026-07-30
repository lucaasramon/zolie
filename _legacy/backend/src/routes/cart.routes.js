const { Router } = require('express');
const c = require('../controllers/cart.controller');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const { authRequired } = require('../middlewares/auth');
const s = require('./schemas');

const r = Router();
r.use(authRequired);
r.get('/', asyncHandler(c.get));
r.post('/items', validate({ body: s.cartItemSchema }), asyncHandler(c.addItem));
r.patch('/items/:id', validate({ body: s.quantitySchema }), asyncHandler(c.updateItem));
r.delete('/items/:id', asyncHandler(c.removeItem));
r.post('/shipping', validate({ body: s.cepSchema }), asyncHandler(c.shipping));
r.post('/coupon', validate({ body: s.couponCodeSchema }), asyncHandler(c.coupon));

module.exports = r;
