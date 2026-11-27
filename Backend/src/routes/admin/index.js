const express = require('express');
const { requireAdmin } = require('../../middleware/adminAuth');

const router = express.Router();

router.use('/auth', require('./auth'));
// Everything below is for signed-in admins only.
router.use(requireAdmin);
router.use('/dashboard', require('./dashboard'));
router.use('/orders', require('./orders'));
router.use('/customers', require('./customers'));
router.use('/drivers', require('./drivers'));
router.use('/catalog', require('./catalog'));
router.use('/referrals', require('./referrals'));
router.use('/finance', require('./finance'));
router.use('/reports', require('./reports'));
router.use('/notifications', require('./notifications'));

module.exports = router;
