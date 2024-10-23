const db = require('../config/db.js');
const ApiError = require('../utils/ApiError.js');
const { ApiResponse } = require('../utils/ApiResponse.js');

// Get all payments
exports.getPayments = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM payment'); // Don't destructure here initially
        const rows = result[0]; // Extract the first item (actual rows)

        return res.status(200).json(
            new ApiResponse(200, rows, 'Payments retrieved successfully')
        );
    } catch (err) {
        console.error(err);
        return new ApiError(500, `Failed to retrieve payments: ${err.message}`);
    }
};
// Create a new payment
exports.createPayment = async (req, res) => {
    const { order_id, amount, currency, payment_method_id, payment_status_id } = req.body;
    console.log("test", req.body)
    try {
        const query =`INSERT INTO payment (order_id, amount, currency, payment_method_id, payment_status_id) VALUES (?, ?, ?, ?, ?)`
          db.query(query,[order_id, amount, currency, payment_method_id, payment_status_id],(err, result)=>{

           if (err){
            console.log("error", err)
            return new ApiError(500, `Failed to create payment: ${err.message}`);
           }
            return res.status(200).json(
                new ApiResponse(200, { paymentId:result.insertId  }, 'payment created successfully')
            ) 
        }
     );
    } catch (err) {
        console.log("errormsg",err)
        return new ApiError(400, `Error in creating payment: ${err}`)
    }
};

// Update payment method and status
// Update payment method and status
exports.updatePayment = async (req, res) => {
    const { id } = req.params;
    const { payment_method_id, payment_status_id } = req.body;

    console.log("Request params:", req.params);
    console.log("Request body:", req.body);

    // Check if there is something to update
    if (!payment_method_id && !payment_status_id) {
        return res.status(400).json(new ApiError(400, 'No fields to update'));
    }

    try {
        // Run the query
        const result = await db.query(
            `UPDATE payment 
             SET payment_method_id = COALESCE(?, payment_method_id), 
                 payment_status_id = COALESCE(?, payment_status_id)
             WHERE id = ?`,
            [payment_method_id, payment_status_id, id]
        );
    
        // Log the result to see its structure
        console.log("DB query result:", result);
    
        // If result is an object, use it directly
        if (result.affectedRows === 0) {
            return res.status(404).json(new ApiError(404, 'Payment not found'));
        }
    
        return res.status(200).json(
            new ApiResponse(200, null, 'Payment updated successfully')
        );
    } catch (err) {
        console.error("Error occurred while updating payment:", err);
        return res.status(500).json(new ApiError(500, `Failed to update payment: ${err.message}`));
    }
};

