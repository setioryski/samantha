const express = require('express');
const router = express.Router();
const {
  getExpenses,
  createExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.route('/').get(protect, isAdmin, getExpenses).post(protect, isAdmin, createExpense);

router.route('/:id').delete(protect, isAdmin, deleteExpense);

module.exports = router;