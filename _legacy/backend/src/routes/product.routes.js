const { Router } = require('express');
const c = require('../controllers/product.controller');
const reviews = require('../controllers/review.controller');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const { authRequired, adminRequired } = require('../middlewares/auth');
const s = require('./schemas');

const r = Router();
r.get('/', asyncHandler(c.list));
r.get('/:slug', asyncHandler(c.detail));
r.get('/:id/reviews', asyncHandler(reviews.list));
r.post('/:id/reviews', authRequired, validate({ body: s.reviewSchema }), asyncHandler(reviews.create));

r.post('/', authRequired, adminRequired, validate({ body: s.productSchema }), asyncHandler(c.create));
r.put('/:id', authRequired, adminRequired, validate({ body: s.productSchema.partial() }), asyncHandler(c.update));
r.delete('/:id', authRequired, adminRequired, asyncHandler(c.remove));

module.exports = r;
