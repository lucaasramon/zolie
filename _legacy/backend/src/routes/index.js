const { Router } = require('express');

const router = Router();

router.get('/health', (req, res) => res.json({ data: { status: 'ok', dataSource: require('../repositories').dataSource } }));
router.use('/auth', require('./auth.routes'));
router.use('/products', require('./product.routes'));
router.use('/categories', require('./category.routes'));
router.use('/addresses', require('./address.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/orders', require('./order.routes'));
router.use('/coupons', require('./coupon.routes'));
router.use('/wishlist', require('./wishlist.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
