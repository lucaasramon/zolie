const { Router } = require('express');
const c = require('../controllers/admin.controller');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { authRequired, adminRequired } = require('../middlewares/auth');

const r = Router();
r.use(authRequired, adminRequired);
r.get('/dashboard', asyncHandler(c.dashboard));
r.get('/orders', asyncHandler(c.orders));
r.get('/banners', asyncHandler(c.banners));
r.post('/banners', asyncHandler(c.createBanner));
r.put('/banners/:id', asyncHandler(c.updateBanner));
r.delete('/banners/:id', asyncHandler(c.removeBanner));

module.exports = r;
