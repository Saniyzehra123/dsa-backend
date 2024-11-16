// routes/products.js
const express = require('express');
const router = express.Router();
const { listAllProducts, createOrders, createOrderItem,OrderDetail, sendsuccessMail } = require('../controllers/orderController');

// Route to list all products
router.get('/search', listAllProducts);
router.post('/add', createOrders);
router.post('/items', createOrderItem)
router.get('/detail/:order_id', OrderDetail)
router.post("/success", sendsuccessMail)

module.exports = router;
