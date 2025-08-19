const express = require('express');
const router = express.Router();
const { createAdjustment } = require('../controllers/adjustmentController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.route('/').post(protect, isAdmin, createAdjustment);

module.exports = router;