 // routes/products.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middleware/multerMidleware');

// Route to get all products
router.get('/', productController.getAllProducts);

// Route to get one product by id
router.get('/:id', productController.getProductById);

router.post('/', productController.createProduct); // Added this line

// router.post('/', upload.array('images', 6), productController.createProduct);

router.post('/', upload.array('images', 6), productController.createProduct);

// Route to delete a product by ID
router.delete('/:id', productController.deleteProduct);


module.exports = router;


