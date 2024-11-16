const express = require('express');
const {   adminLogin, adminRegister } = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const { verifyToken, verifyAdminToken } = require('../middleware/authMiddleware');

const router = express.Router();

// User Routes
// router.post('/register', register);   // User registration
// router.post('/login', login);         // User login
// router.post('/logout', logout);       // User logout
router.get('/customer/details/:customer_id', customerController.getCustomerDetails);
// New PATCH route to update customer profile
router.patch('/customer/profile/:customer_id', customerController.updateCustomerProfile);


router.post('/customer/forgot-password', customerController.forgotPassword);
router.post('/customer/reset-password', customerController.resetPassword);

router.post('/customer/register', customerController.register);
router.post('/customer/login', customerController.login);
router.post('/customer/otp', customerController.customerLoginWithOtp);

// Admin Routes (Separate login page for admin)
router.post('/admin/login', adminLogin); 
router.post('/admin/register', adminRegister);


 

module.exports = router;

 
