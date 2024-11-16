 // controllers/wishlistController.js
const wishlistModel = require("../model/wishListModel");
const ApiError = require("../utils/ApiError");
const { ApiResponse } = require('../utils/ApiResponse.js');
const db =require('../config/db.js')


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
  const { customer_id } = req.params; // Properly extracting customer_id from params
  // console.log("customer", customer_id);

  try {
    const query = `SELECT * FROM wishlist WHERE customer_id = ?`

    db.query(query, [customer_id], (err, results) => {
        if (err) {
            return res.status(500).json(new ApiError(500, `Internal server error: ${err.message}`));
        }
        if (results.length === 0) {
            return res.status(404).json(new ApiError(404, `Product with ID ${customer_id} not found`));
        }
        return res.status(200).json(
            new ApiResponse(200, results[0], 'Product details retrieved successfully')
        );
    });
} catch (error) {
    return res.status(500).json(new ApiError(500, `Error fetching product details: ${error.message}`));
}
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
