const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Any logged-in user can view categories, but only admins can modify them
router.route('/')
    .get(protect, getCategories)
    .post(protect, isAdmin, createCategory);

router.route('/:id')
    .delete(protect, isAdmin, deleteCategory);

module.exports = router;