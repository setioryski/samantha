const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { registerUser } = require('../controllers/authController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.route('/').get(protect, isAdmin, getUsers).post(protect, isAdmin, registerUser);
router
    .route('/:id')
    .get(protect, isAdmin, getUserById)
    .put(protect, isAdmin, updateUser)
    .delete(protect, isAdmin, deleteUser);

module.exports = router;