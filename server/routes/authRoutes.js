const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// @route   POST /api/auth/login
router.post('/login', loginUser);

// @route   POST /api/auth/register
// This route is protected. Only a logged-in Admin can create new users.
// To create the FIRST Admin, you can temporarily remove the 'protect' and 'isAdmin' middleware,
// run the server, register the Admin using a tool like Postman, then add the middleware back.
router.post('/register', registerUser);     

module.exports = router;