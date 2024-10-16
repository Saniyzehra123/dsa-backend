const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');


// Add a new address for the customer
exports.addAddress = async (req, res, next) => {
    const { customer_id, city, address, state, pincode, country, landmark, mobile, email, firstname, lastname } = req.body;

    // Check if required fields are missing
    if (!customer_id || !city || !address || !state || !pincode || !country || !mobile || !email || !firstname || !lastname) {
        return next(new ApiError(400, 'Missing required fields.'));
    }

    // Optional fields can have a default value or can be nullable in the database
    const query = `
        INSERT INTO customers_address 
        (customer_id, city, address, state, pincode, country, landmark, mobile, email, firstname, lastname) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    console.log("req", req.body); // Debugging

    try {
        // Handle cases where landmark might be empty
        db.query(query, [customer_id, city, address, state, pincode, country, landmark || null, mobile, email, firstname, lastname], (err, result) => {
            if (err) {
                return next(new ApiError(500, `Error adding address: ${err.message}`));
            }
            return res.status(201).json(
                new ApiResponse(201, { addressId: result.insertId }, 'Address added successfully')
            );
        });
    } catch (error) {
        return next(new ApiError(500, `Internal server error: ${error?.message}`));
    }
};



// Get all addresses for a specific customer
exports.getAddresses = async (req, res, next) => {
    const customerId = req.params.customer_id;
    const query = `SELECT * FROM customers_address WHERE customer_id = ?`;

    try {
        db.query(query, [customerId], (err, results) => {
            if (err) {
                return next(new ApiError(500, `Error fetching addresses: ${err.message}`));
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'No addresses found for this customer' });
            }
            return res.status(200).json({ data: results, message: 'Addresses retrieved successfully' });
        });
    } catch (error) {
        next(new ApiError(500, `Internal server error: ${error.message}`));
    }
};

// Update an address by ID
exports.updateAddress = async (req, res, next) => {
    const { address_id, city, address, state, pincode, country } = req.body;
    const query = `UPDATE customers_address SET city = ?, address = ?, state = ?, pincode = ?, country = ? WHERE id = ?`;

    try {
        db.query(query, [city, address, state, pincode, country, address_id], (err, result) => {
            if (err) {
                return next(new ApiError(500, `Error updating address: ${err.message}`));
            }
            if (result.affectedRows === 0) {
                return next(new ApiError(404, 'Address not found'));
            }
            return res.status(200).json(
                new ApiResponse(200, null, 'Address updated successfully')
            );
        });
    } catch (error) {
        next(new ApiError(500, `Internal server error: ${error.message}`));
    }
};

// Delete an address by ID
exports.deleteAddress = async (req, res, next) => {
    const addressId = req.params.address_id;
    const query = `DELETE FROM customers_address WHERE id = ?`;

    try {
        db.query(query, [addressId], (err, result) => {
            if (err) {
                return next(new ApiError(500, `Error deleting address: ${err.message}`));
            }
            if (result.affectedRows === 0) {
                return next(new ApiError(404, 'Address not found'));
            }
            return res.status(200).json(
                new ApiResponse(200, null, 'Address deleted successfully')
            );
        });
    } catch (error) {
        next(new ApiError(500, `Internal server error: ${error.message}`));
    }
};
