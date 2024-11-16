const db = require('../config/db.js');
const ApiError = require('../utils/ApiError.js');
const { ApiResponse } = require('../utils/ApiResponse.js');
const nodemailer = require('nodemailer');

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
    const { order_id, amount, currency, payment_method_id, payment_status_id,email } = req.body;   
    //  console.log("test", req.body)
    try {
        const query =`INSERT INTO payment (order_id, amount, currency, payment_method_id, payment_status_id) VALUES (?, ?, ?, ?, ?)`
          db.query(query,[order_id, amount, currency, payment_method_id, payment_status_id],async(err, result)=>{

           if (err){
            console.log("error", err)
            return new ApiError(500, `Failed to create payment: ${err.message}`);
           }
           if(order_id>0 && email.length>0){
                await sendOrderConfirmationEmail(order_id, email)
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

    // console.log("Request params:", req.params);
    // console.log("Request body:", req.body);

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
        // console.log("DB query result:", result);
    
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

const getOrderDetails = (order_id) => {
    let query = `WITH OrderTotals AS (
            SELECT
              oi.order_id,
              SUM(oi.price * oi.quantity) AS total_amount,
              SUM(oi.quantity) AS total_quantity,
              COUNT(DISTINCT oi.item_id) AS total_items
            FROM order_items oi
            GROUP BY oi.order_id
        )
        SELECT
            o.id AS order_id,
            oi.id AS order_item_id,
            c.username AS customer_name,
            ca.firstname,
            ca.lastname,
            ca.address,
            ca.landmark,
            ca.city,
            ca.mobile,
            ca.state,
            ca.pincode,
            ca.country,
            ot.total_quantity,
            ot.total_amount,
            ot.total_items,
            i.main_image_url,
            i.title,
            oi.price,
            oi.quantity,
            pm.methods AS payment_method,
            ps.payment_status AS payment_status
            FROM orders o
            INNER JOIN order_items oi ON oi.order_id = o.id
            INNER JOIN items i ON i.id = oi.item_id
            INNER JOIN customers c ON c.id = o.customer_id
            LEFT JOIN customers_address ca ON ca.customer_id = c.id
            INNER JOIN OrderTotals ot ON ot.order_id = o.id
            LEFT JOIN payment p ON p.order_id = o.id
            LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
            LEFT JOIN payment_status ps ON ps.id = p.payment_status_id
            WHERE o.id = ?`;
  
    return new Promise((resolve, reject) => {
      db.query(query, [order_id], (err, results) => {
        if (err) {
          reject(new ApiError(500, `Database query failed: ${err.message}`));
        } else if (results.length === 0) {
          reject(new ApiError(404, 'No orders found'));
        } else {
          // Structure the results into an orderDetails object
          const orderDetails = {
            order_id: results[0].order_id,
            customer_name: results[0].customer_name,
            address: {
              firstname: results[0].firstname,
              lastname: results[0].lastname,
              address: results[0].address,
              landmark: results[0].landmark,
              city: results[0].city,
              mobile: results[0].mobile,
              state: results[0].state,
              pincode: results[0].pincode,
              country: results[0].country,
            },
            total_quantity: results[0].total_quantity,
            total_amount: results[0].total_amount,
            total_items: results[0].total_items,
            payment: {
              payment_status: results[0].payment_status,
              payment_method: results[0].payment_method
            },
            order_items: results.map(item => ({
              order_item_id: item.order_item_id,
              main_image_url: item.main_image_url,
              price: item.price,
              title: item.title,
              quantity: item.quantity,
              total_price: item.quantity * item.price
            }))
          };
          resolve(orderDetails);
        }
      });
    });
  };
  
  const sendOrderConfirmationEmail = async (order_id, email) => {
    try {
      // Fetch order details from the database using the order ID
      const orderDetails = await getOrderDetails(order_id);
  
      // Extract relevant information from the orderDetails object
      const { customer_name, address, order_items, total_amount, payment, order_id: orderId, payment: { payment_status, payment_method } } = orderDetails;
      const { firstname, lastname, email: customerEmail, address: addr, city, state, pincode, country, mobile } = address;
  
      const orderItems = order_items.map(product => `
        <div class="item-info">
            <span>${product.title}</span>
            <span>Quantity: ${product.quantity}</span>
            <span>$${product.price}</span>
        </div>`).join('');
  
      const html = `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order Confirmation</title>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; }
                    .container { max-width: 600px; margin: 20px auto; background-color: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
                    .header { text-align: center; padding: 10px 0; }
                    .header h1 { color: #4CAF50; font-size: 24px; }
                    .order-details, .customer-details, .shipping-address, .order-summary { margin-bottom: 20px; }
                    .order-info { display: flex; justify-content: space-between; padding: 5px 0; }
                    .item-info { border-bottom: 1px solid #f4f4f4; padding-bottom: 10px; }
                    .total { font-weight: bold; font-size: 16px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Thank You for Your Order, ${firstname}!</h1>
                        <p>Your order has been placed successfully.</p>
                    </div>
  
                    <div class="order-details">
                        <h2>Order Details</h2>
                        <div class="order-info">
                            <span>Order Number:</span>
                            <span>#${orderId}</span>
                        </div>
                        <div class="order-info">
                            <span>Order Date:</span>
                            <span>${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
  
                    <div class="customer-details">
                        <h2>Customer Details</h2>
                        <div class="order-info">
                            <span>Name:</span>
                            <span>${firstname} ${lastname}</span>
                        </div>
                        <div class="order-info">
                            <span>Email:</span>
                            <span>${customerEmail}</span>
                        </div>
                    </div>
  
                    <div class="shipping-address">
                        <h2>Shipping Address</h2>
                        <p>${addr}, ${city}, ${state}, ${pincode}, ${country}</p>
                    </div>
  
                    <div class="order-summary">
                        <h2>Order Summary</h2>
                        ${orderItems}
                        <div class="item-info total">
                            <span>Total:</span>
                            <span>$${total_amount}</span>
                        </div>
                    </div>
  
                    <div class="footer">
                        <p>If you have any questions about your order, please contact us at <a href="mailto:support@example.com">support@example.com</a>.</p>
                        <p>Thank you for shopping with us!</p>
                    </div>
                </div>
            </body>
        </html>`;
  
      // Set up Nodemailer for sending emails
      let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: parseInt(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
  
      // Admin email notification
      const adminMailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'New Order Submitted',
        text: `A new order has been placed by ${firstname} ${lastname}.`,
      };
  
      // Send email to the customer
      const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Thank you for ordering from us!',
        html: html,
      };
  
      // Send both emails
      await transporter.sendMail(adminMailOptions);  // Send email to Admin
      await transporter.sendMail(userMailOptions);    // Send email to User
  
      return { message: 'Order placed successfully, confirmation emails sent!' };
    } catch (error) {
      throw new Error(error.message);
    }
  };
