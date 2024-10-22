const express = require('express');
const router = express.Router();
const paymentgatewayController = require('../controllers/paymentgatewayController');

// Route to initiate payment
router.post('/initiate', paymentgatewayController.initiatePayment);

// Route for PhonePe callback
router.post('/callback', paymentgatewayController.paymentCallback);

// Route to verify payment status
router.post('/verify', paymentgatewayController.verifyPayment);

module.exports = router;
