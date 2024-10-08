const shippingModel = require('../model/shippingModel');
const { ApiResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const db =require('../config/db')

// Create a new shipping entry
const createShipping = async (req, res) => {
  try {
    const { order_id, customer_id, shipping_method_id, shipping_cost, order_status_id } = req.body;

    // Validate required fields
    if (!order_id || !customer_id || !shipping_method_id || !order_status_id) {
      throw new ApiError(400, 'Missing required fields');
    }

    // Create shipping
    const shippingId = await shippingModel.createShipping(order_id, customer_id, shipping_method_id, shipping_cost, order_status_id);

    return res.status(201).json(new ApiResponse(201, { shippingId }, 'Shipping entry created successfully'));
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
};

// Get shipping details by order ID
const getShipping = async (req, res) => {
  
  try {
    const orderId = req.params.id;
    console.log('req', orderId)
    const query =`SELECT * FROM shipping WHERE order_id = ?`;
    db.query(query, [orderId], (err, results) => {
      console.log('res', results, err)
        if(err) {
          return (new ApiError(500, `Internal server error: ${err.message}`));
        }
        if(results.length == 0) {
           return (new ApiError(404, `Shipping with ID ${orderId} data not found`));
        }
        return res.status(200).json(
            (new ApiResponse(200, results, 'Shippping details retrieved successfully'))
        );
    });
  
  } catch (error) {
    return (new ApiError(500, error)); // Pass the error to the error-handling middleware
  }
};

// Update shipping status
const updateShippingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status_id } = req.body;
    // Validate required fields
    if (!order_status_id) {
      throw new ApiError(400, 'Missing required order status');
    }

    // Update shipping status
    const updatedRows = await shippingModel.updateShippingStatus(id, order_status_id);

    if (updatedRows === 0) {
      throw new ApiError(404, 'Shipping entry not found');
    }

    return res.status(200).json(new ApiResponse(200, { updatedRows }, 'Shipping status updated successfully'));
  } catch (error) {
    return (new ApiError(500,error)); // Pass the error to the error-handling middleware
  }
};

module.exports = {
  createShipping,
  getShipping,
  updateShippingStatus
};
