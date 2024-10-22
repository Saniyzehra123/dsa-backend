const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

// Add a new address
router.post('/add', addressController.addAddress);

// Get all addresses for a customer
router.get('/:customer_id', addressController.getAddresses);

// Update an existing address
router.patch('/update', addressController.updateAddress);

// Delete an address
router.delete('/delete/:address_id', addressController.deleteAddress);

module.exports = router;
