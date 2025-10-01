const express = require('express');
const router = express.Router();
const {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Admins can do anything, Cashiers can only view and create
router.route('/')
    .get(protect, getCustomers)
    .post(protect, createCustomer);

router.route('/:id')
    .put(protect, isAdmin, updateCustomer)
    .delete(protect, isAdmin, deleteCustomer);

module.exports = router;