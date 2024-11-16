// routes/invoiceRoutes.js
const express = require('express');
const { createInvoice, getInvoice } = require('../controllers/invoiceController');
const router = express.Router();

// Route to create a new invoice
router.post('/create', createInvoice);

// Route to fetch invoice details by order ID or user ID
router.get('/', getInvoice);

module.exports = router;
