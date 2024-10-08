const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Route to initiate payment
router.post('/initiate', paymentController.initiatePayment);

// Route for PhonePe callback
router.post('/callback', paymentController.paymentCallback);

// Route to verify payment status
router.post('/verify', paymentController.verifyPayment);

module.exports = router;
