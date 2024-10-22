const db = require('../config/db.js');
const ApiError = require('../utils/ApiError.js');
const { ApiResponse } = require('../utils/ApiResponse.js');

// Get all payments
exports.getPayments = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Payments');
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve payments' });
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
exports.updatePayment = async (req, res) => {
    const { payment_id } = req.params;
    const { payment_method_id, payment_status_id } = req.body;

    try {
        const [result] = await db.query(
            `UPDATE Payments 
             SET payment_method_id = ?, payment_status_id = ? 
             WHERE payment_id = ?`,
            [payment_method_id, payment_status_id, payment_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.status(200).json({ message: 'Payment updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update payment' });
    }
};
