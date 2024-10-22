const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// GET all payments
router.get('/', paymentController.getPayments);

// POST a new payment
router.post('/', paymentController.createPayment);

// PUT to update payment status or method
router.put('/:payment_id', paymentController.updatePayment);

module.exports = router;
