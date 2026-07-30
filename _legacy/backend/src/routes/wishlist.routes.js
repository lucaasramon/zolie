const { Router } = require('express');
const c = require('../controllers/wishlist.controller');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { authRequired } = require('../middlewares/auth');

const r = Router();
r.use(authRequired);
r.get('/', asyncHandler(c.list));
r.post('/:productId', asyncHandler(c.add));
r.delete('/:productId', asyncHandler(c.remove));

module.exports = r;
