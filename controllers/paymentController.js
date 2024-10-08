const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/db');

// Initiate payment request
exports.initiatePayment = async (req, res) => {
    const { orderId, amount } = req.body; // Amount should be in paise (e.g., 1 INR = 100 paise)

    try {
        const payload = {
            merchantId: config.merchantId,
            transactionId: orderId,  // Your unique order ID
            amount: amount,          // Amount in paise
            merchantOrderId: orderId,
            merchantUserId: 'user_id',  // Your user ID
            callbackUrl: config.callbackUrl,
            mobileNumber: 'USER_MOBILE_NUMBER'
        };

        const payloadString = JSON.stringify(payload);

        // Generate hash for payload and key
        const hash = crypto.createHash('sha256').update(payloadString + '/pg/v1/pay' + config.merchantKey).digest('hex');

        const response = await axios.post(`${config.baseUrl}/pg/v1/pay`, payloadString, {
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': hash + '###1',  // PhonePe X-VERIFY format
            }
        });

        // Return the response from PhonePe to the frontend
        res.json(response.data);

    } catch (err) {
        console.error('Payment initiation failed:', err);
        res.status(500).json({ message: 'Payment initiation failed' });
    }
};

// Handle payment callback (PhonePe will call this endpoint after payment is processed)
exports.paymentCallback = async (req, res) => {
    const { transactionId, responseCode, responseMessage } = req.body;

    if (responseCode === 'PAYMENT_SUCCESS') {
        // Update your database with payment success
        res.json({ message: 'Payment successful', transactionId });
    } else {
        // Handle payment failure in the database
        res.status(400).json({ message: 'Payment failed', responseMessage });
    }
};

// Verify payment status (in case callback is missed)
exports.verifyPayment = async (req, res) => {
    const { orderId } = req.body;

    try {
        const hash = crypto.createHash('sha256').update(`/pg/v1/status/${config.merchantId}/${orderId}${config.merchantKey}`).digest('hex');

        const response = await axios.get(`${config.baseUrl}/pg/v1/status/${config.merchantId}/${orderId}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': hash + '###1',
            }
        });

        res.json(response.data);
    } catch (err) {
        console.error('Payment verification failed:', err);
        res.status(500).json({ message: 'Payment verification failed' });
    }
};

















// const db = require('../config/db');

// // Handle Payment
// exports.handlePayment = (req, res) => {
//     const { order_id, payment_method, transaction_id } = req.body;
    
//     // Get payment_method_id based on payment_method (PhonePe or COD)
//     const getPaymentMethodSQL = 'SELECT id FROM payment_methods WHERE methods = ?';
//     db.query(getPaymentMethodSQL, [payment_method], (err, result) => {
//         if (err) {
//             return res.status(500).send('Database error: Payment method lookup failed');
//         }

//         const payment_method_id = result[0].id;
//         let payment_status_id;
        
//         // If PhonePe, check if the payment was successful or pending
//         if (payment_method === 'PhonePe') {
//             // Assuming you have some logic to check payment status (mocked here)
//             const isPaymentSuccessful = checkPhonePePayment(transaction_id);
//             if (isPaymentSuccessful) {
//                 payment_status_id = 2; // Success
//             } else {
//                 payment_status_id = 1; // Pending
//             }
//         } else if (payment_method === 'Cash on Delivery') {
//             payment_status_id = 4; // Cash on Delivery
//         }

//         // Insert payment details into the database
//         const insertPaymentSQL = `INSERT INTO payments (order_id, payment_method_id, payment_status_id, transaction_id)
//                                   VALUES (?, ?, ?, ?)`;
//         db.query(insertPaymentSQL, [order_id, payment_method_id, payment_status_id, transaction_id], (err, result) => {
//             if (err) {
//                 return res.status(500).send('Database error: Unable to process payment');
//             }
//             res.status(201).send('Payment processed successfully');
//         });
//     });
// };

// // Mock PhonePe Payment Check Function (You will need an actual API integration for PhonePe)
// function checkPhonePePayment(transaction_id) {
//     // In a real scenario, you would call PhonePe's API to verify payment status
//     // Here we mock the payment status as successful
//     return transaction_id ? true : false;
// }
