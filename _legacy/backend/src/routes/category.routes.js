const { Router } = require('express');
const c = require('../controllers/category.controller');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { authRequired, adminRequired } = require('../middlewares/auth');

const r = Router();
r.get('/', asyncHandler(c.list));
r.post('/', authRequired, adminRequired, asyncHandler(c.create));
r.put('/:id', authRequired, adminRequired, asyncHandler(c.update));
r.delete('/:id', authRequired, adminRequired, asyncHandler(c.remove));

module.exports = r;
