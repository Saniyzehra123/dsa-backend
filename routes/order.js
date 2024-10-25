// routes/products.js
const express = require('express');
const router = express.Router();
const { listAllProducts, createOrders, createOrderItem,OrderDetail } = require('../controllers/orderController');

// Route to list all products
router.get('/:customer_id/:order_id', listAllProducts);
router.post('/add', createOrders);
router.post('/items', createOrderItem)
router.get('/detail/:customer_id/:order_id', OrderDetail)

module.exports = router;
