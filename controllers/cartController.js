const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');

// Add item to cart
exports.addItemToCart = async (req, res) => {
    const { customer_id, item_id, quantity } = req.body;
    const query = `INSERT INTO cart (customer_id, item_id, quantity) VALUES (?, ?, ?)`;

    try {
        db.query(query, [customer_id, item_id, quantity], (err, result) => {
            if (err) {
                return (new ApiError(500, `Error adding item to cart: ${err.message}`));
            }
            return res.status(201).json(
                new ApiResponse(201, { cartId: result.insertId }, 'Item added to cart successfully')
            );
        });
    } catch (error) {
        return (new ApiError(500, `Internal server error: ${error.message}`));
    }
};

// View the cart for a specific customer
exports.getCartByCustomerId = async (req, res) => {
    const customerId = req.params.customer_id;
    const query = `
               SELECT 
            c.id AS cart_id, c.quantity, 
            i.id AS item_id, i.sarees_id, 
            i.price, 
            sa.main_image_url
        FROM cart c
        INNER JOIN items i ON c.item_id = i.id
        INNER JOIN saree_attributes sa ON i.sarees_id = sa.id
        WHERE c.customer_id = ?;` // Use the customerId parameter here

    try {
        db.query(query, [customerId], (err, results) => {
            if (err) {
                return res.status(500).json({ message: `Error fetching cart: ${err.message}` });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Cart is empty for this customer' });
            }
            return res.status(200).json({ data: results, message: 'Cart retrieved successfully' });
        });
    } catch (error) {
        return res.status(500).json({ message: `Internal server error: ${error.message}` });
    }
};



// Update the quantity of an item in the cart
exports.updateCartItem = async (req, res, next) => {
    const { cart_id, quantity } = req.body;
    const query = `UPDATE cart SET quantity = ? WHERE id = ?`;

    try {
        db.query(query, [quantity, cart_id], (err, result) => {
            if (err) {
                return next(new ApiError(500, `Error updating cart item: ${err.message}`));
            }
            if (result.affectedRows === 0) {
                return next(new ApiError(404, 'Cart item not found'));
            }
            return res.status(200).json(
                new ApiResponse(200, null, 'Cart item updated successfully')
            );
        });
    } catch (error) {
        next(new ApiError(500, `Internal server error: ${error.message}`));
    }
};

// Remove an item from the cart
exports.removeItemFromCart = async (req, res, next) => {
    const cart_id = req.params.cart_id;
    const query = `DELETE FROM cart WHERE id = ?`;

    try {
        db.query(query, [cart_id], (err, result) => {
            if (err) {
                return next(new ApiError(500, `Error removing cart item: ${err.message}`));
            }
            if (result.affectedRows === 0) {
                return next(new ApiError(404, 'Cart item not found'));
            }
            return res.status(200).json(
                new ApiResponse(200, null, 'Cart item removed successfully')
            );
        });
    } catch (error) {
        next(new ApiError(500, `Internal server error: ${error.message}`));
    }
};
