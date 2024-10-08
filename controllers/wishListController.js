 // controllers/wishlistController.js
const wishlistModel = require("../model/wishListModel");
const ApiError = require("../utils/ApiError");

// Add an item to the wishlist
const addToWishlist = async (req, res) => {
  const { customer_id, item_id } = req.body;

  if (!customer_id || !item_id) {
    throw new ApiError(400, "Missing required fields");
  }

  const wishlistId = await wishlistModel.addItemToWishlist(customer_id, item_id);

  res.status(201).json({
    message: "Item added to wishlist successfully",
    wishlistId,
  });
};

// Get all wishlist items for a customer
const getWishlist = async (req, res) => {
  const { customerId } = req.params;

  const wishlistItems = await wishlistModel.getWishlistByCustomerId(customerId);

  if (!wishlistItems.length) {
    throw new ApiError(404, "No items found in the wishlist for this customer");
  }

  res.status(200).json({
    message: "Wishlist retrieved successfully",
    data: wishlistItems,
  });
};

// Remove an item from the wishlist
const removeFromWishlist = async (req, res) => {
  const { wishlistId } = req.params;

  const removedRows = await wishlistModel.removeItemFromWishlist(wishlistId);

  if (removedRows === 0) {
    throw new ApiError(404, "Wishlist item not found");
  }

  res.status(200).json({
    message: "Item removed from wishlist successfully",
  });
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
};
