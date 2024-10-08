// routes/cart.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Add an item to the cart
router.post('/add', cartController.addItemToCart);

// View cart by customer ID
router.get('/view/:customer_id', cartController.getCartByCustomerId);

// Update cart item quantity
router.patch('/update', cartController.updateCartItem);

// Remove an item from the cart
router.delete('/remove/:cart_id', cartController.removeItemFromCart);

module.exports = router;
