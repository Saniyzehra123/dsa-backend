 // models/wishlistModel.js
const db = require("../config/db");

// Add an item to the wishlist
const addItemToWishlist = async (customer_id, item_id) => {
  const result = await db.query(
    `INSERT INTO wishlist (customer_id, item_id) VALUES (?, ?)`,
    [customer_id, item_id]
  );
  return result.insertId;
};

// Get all wishlist items for a customer
const getWishlistByCustomerId = async (customer_id) => {
  const [wishlistItems] = await db.query(
    `SELECT * FROM wishlist WHERE customer_id = ?`,
    [customer_id]
  );
  return wishlistItems;
};

// Remove an item from the wishlist
const removeItemFromWishlist = async (wishlist_id) => {
  const result = await db.query(
    `DELETE FROM wishlist WHERE id = ?`,
    [wishlist_id]
  );
  return result.affectedRows;
};

module.exports = {
  addItemToWishlist,
  getWishlistByCustomerId,
  removeItemFromWishlist,
};
