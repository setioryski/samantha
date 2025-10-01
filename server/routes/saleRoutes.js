// setioryski/apptechary-app/apptechary-app-new3/server/routes/saleRoutes.js

const express = require('express');
const router = express.Router();
const {
  addSale,
  getSales,
  getSaleById,
  retractSale,
  getTopProducts,
  getAllSellingProducts,
  getTodaysSales,
  updateSaleToPaid,
  updateSale, 
  deleteSale,
} = require('../controllers/saleController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, addSale)
    .get(protect, isAdmin, getSales);

router.get('/topproducts', protect, isAdmin, getTopProducts);
router.get('/allselling', protect, isAdmin, getAllSellingProducts);
router.get('/today', protect, getTodaysSales);

router.route('/:id')
    .get(protect, getSaleById)
    .put(protect, updateSale)
    .delete(protect, isAdmin, deleteSale); 

router.route('/:id/retract').put(protect, isAdmin, retractSale);
router.route('/:id/pay').put(protect, updateSaleToPaid);

module.exports = router;