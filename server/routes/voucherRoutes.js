const express = require('express');
const router = express.Router();
const {
    getVouchers,
    getActiveVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher
} = require('../controllers/voucherController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, isAdmin, getVouchers)
    .post(protect, isAdmin, createVoucher);

router.get('/active', protect, getActiveVouchers);

router.route('/:id')
    .put(protect, isAdmin, updateVoucher)
    .delete(protect, isAdmin, deleteVoucher);

module.exports = router;