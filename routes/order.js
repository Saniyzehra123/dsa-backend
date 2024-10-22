// routes/products.js
const express = require('express');
const router = express.Router();
const { listAllProducts, createOrders } = require('../controllers/orderController');

// Route to list all products
router.get('/all-orders', listAllProducts);
router.post('/add', createOrders);

module.exports = router;
