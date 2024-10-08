 // routes/products.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Route to get all products
router.get('/', productController.getAllProducts);

// Route to get one product by id
router.get('/:id', productController.getProductById);

module.exports = router;


