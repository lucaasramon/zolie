const { Router } = require('express');
const c = require('../controllers/auth.controller');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const { authRequired } = require('../middlewares/auth');
const s = require('./schemas');

const r = Router();
r.post('/register', validate({ body: s.registerSchema }), asyncHandler(c.register));
r.post('/login', validate({ body: s.loginSchema }), asyncHandler(c.login));
r.post('/admin/login', validate({ body: s.loginSchema }), asyncHandler(c.adminLogin));
r.post('/forgot-password', validate({ body: s.forgotSchema }), asyncHandler(c.forgotPassword));
r.post('/reset-password', validate({ body: s.resetSchema }), asyncHandler(c.resetPassword));
r.get('/me', authRequired, asyncHandler(c.me));
r.put('/me', authRequired, validate({ body: s.profileSchema }), asyncHandler(c.updateProfile));

module.exports = r;
