const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getSettings) // Publicly accessible to show on invoice
    .post(protect, isAdmin, updateSettings); // Only admin can update

module.exports = router;