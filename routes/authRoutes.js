const express = require('express');
const { register, login, logout, adminLogin } = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const { verifyToken, verifyAdminToken } = require('../middleware/authMiddleware');

const router = express.Router();

// User Routes
router.post('/register', register);   // User registration
router.post('/login', login);         // User login
router.post('/logout', logout);       // User logout


router.post('/customer/register', customerController.register);
router.post('/customer/login', customerController.login);

// Admin Routes (Separate login page for admin)
// router.post('/admin/login', adminLogin); // Admin login
// router.post('/admin/logout', logout);    

// Protected routes (for demonstration)
// router.get('/user/useraccount', verifyToken, (req, res) => {
//   res.status(200).json({ message: 'Welcome to user dashboard' });
// });

// router.get('/admin/dashboard', verifyAdminToken, (req, res) => {
//   res.status(200).json({ message: 'Welcome to admin dashboard' });
// });

module.exports = router;
