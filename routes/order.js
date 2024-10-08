// routes/products.js
const express = require('express');
const router = express.Router();
const { listAllProducts } = require('../controllers/orderController');

// Route to list all products
router.get('/all-orders', listAllProducts);

module.exports = router;
