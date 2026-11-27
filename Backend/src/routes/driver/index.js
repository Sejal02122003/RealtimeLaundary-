const express = require('express');
const { requireDriver, requireApproved } = require('../../middleware/auth');
const auth = require('./auth');
const profile = require('./profile');
const jobs = require('./jobs');
const history = require('./history');

const router = express.Router();

router.use('/auth', auth);
router.use('/me', requireDriver, profile);
router.use('/jobs', requireDriver, requireApproved, jobs);
router.use('/history', requireDriver, requireApproved, history);

module.exports = router;
