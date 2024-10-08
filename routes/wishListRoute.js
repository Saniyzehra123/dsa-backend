 // routes/wishlistRoutes.js
const express = require("express");
const wishlistController = require("../controllers/wishListController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Add an item to the wishlist
router.post("/wishlist", asyncHandler(wishlistController.addToWishlist));

// Get all wishlist items for a customer
router.get("/:customerId", asyncHandler(wishlistController.getWishlist));

// Remove an item from the wishlist
router.delete("/:wishlistId", asyncHandler(wishlistController.removeFromWishlist));

module.exports = router;

//module 



