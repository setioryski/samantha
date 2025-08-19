const express = require('express');
const router = express.Router();
const {
  addSale,
  getSales,
  getSaleById,
  retractSale,
  getTopProducts,
  getAllSellingProducts,
  getTodaysSales, // <-- IMPORT THIS
} = require('../controllers/saleController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.route('/').post(protect, addSale).get(protect, isAdmin, getSales);

router.get('/topproducts', protect, isAdmin, getTopProducts);
router.get('/allselling', protect, isAdmin, getAllSellingProducts);

// ADD THIS ROUTE for cashiers to get their daily sales
router.get('/today', protect, getTodaysSales);

router.route('/:id').get(protect, isAdmin, getSaleById);

router.route('/:id/retract').put(protect, isAdmin, retractSale);

module.exports = router;