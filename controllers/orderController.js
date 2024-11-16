// controllers/orderController.js
const db = require('../config/db.js');
const ApiError = require('../utils/ApiError.js');
const { ApiResponse } = require('../utils/ApiResponse.js');
const nodemailer = require('nodemailer');

// Controller function to list all products with order details
exports.listAllProducts = async (req, res, next) => {
  const { customer_id, order_id } = req.query;
  try {
    let query = `
      WITH OrderTotals AS (
        SELECT
          oi.order_id,
          COUNT(DISTINCT oi.item_id) AS total_items
        FROM order_items oi
        GROUP BY oi.order_id
      )
      SELECT
        o.id AS order_id,
        o.created_at,
        oi.item_id,
        oi.quantity,
        oi.price,
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
        i.main_image_url,
        i.title,
        i.code_id, 
        i.des,
        os.status_type,
        pm.methods AS payment_method,
        ot.total_items
      FROM orders o
      INNER JOIN order_items oi ON oi.order_id = o.id
      INNER JOIN items i ON i.id = oi.item_id
      INNER JOIN customers c ON c.id = o.customer_id
      INNER JOIN customers_address ca ON ca.customer_id = c.id
      INNER JOIN order_status os ON os.id = o.order_status_id
      INNER JOIN payment p ON p.order_id = o.id 
      LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
      LEFT JOIN OrderTotals ot ON ot.order_id = o.id
      WHERE c.id = ?
    `;
    const queryParams = [customer_id];

    if (order_id) {
      query += 'AND o.id =?';
      queryParams.push(order_id);
    }
//  console.log("track",queryParams, order_id,customer_id)
    db.query(query, queryParams, (err, results) => {
      if (err) {
        return next(new ApiError(500, `Database query failed: ${err.message}`));
      }
      if (results.length === 0) {
        return next(new ApiError(404, 'No orders found'));
      }
      return res.status(200).json(
        new ApiResponse(200, results, 'List of orders retrieved successfully')
      );
    });
  } catch (error) {
    next(new ApiError(500, `Error fetching order details: ${error.message}`));
  }
};

exports.OrderDetail = async (req, res, next) => {
  const { customer_id, order_id } = req.params;
  // console.log("orders", req.params);
  
  try {
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
          pm.methods as payment_method,
          ps.payment_status as payment_status
          FROM orders o
          INNER JOIN order_items oi ON oi.order_id = o.id
          INNER JOIN items i ON i.id = oi.item_id
          INNER JOIN customers c ON c.id = o.customer_id
          LEFT JOIN customers_address ca ON ca.customer_id = c.id
          INNER JOIN OrderTotals ot ON ot.order_id = o.id
          LEFT JOIN payment p ON p.order_id = o.id
          left join payment_methods pm on pm.id=p.payment_method_id
          left join payment_status ps on ps.id=p.payment_status_id
          WHERE o.id = ?`;

    const queryParams = [order_id];
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        return next(new ApiError(500, `Database query failed: ${err.message}`));
      }
      if (results.length === 0) {
        return next(new ApiError(404, 'No orders found'));
      }

      // Structure the results
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
      
      return res.status(200).json(
        new ApiResponse(200, orderDetails, 'Order details retrieved successfully')
      );
    });
  } catch (error) {
    next(new ApiError(500, `Error fetching order details: ${error.message}`));
  }
};

exports.createOrders=async(req, res)=>{
    const { address_id, billing_id, customer_id} = req.body;
    // console.log("orders", req.body)
    try {
        const query=`insert into orders(customer_id, delivery_address, billing_address, order_status_id) values(?,?,?,1)`
        db.query(query, [customer_id,address_id,billing_id,1],(err, result) => {
            if (err) {
                return new ApiError(500, `Error adding Order: ${err.message}`);
            }
            return res.status(200).json(
                new ApiResponse(200, { orderId: result.insertId }, 'Order created successfully')
            );
        });
    } catch (error) {
        console.log("errormsg",error)
        return new ApiError(400, `Something went wrong ${error}`)
    }
}

exports.createOrderItem = async (req, res) => {
    const { data, orderId } = req.body;
    try {
      let query = `INSERT INTO order_items(order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)`;
      
      // Use Promise.all to handle asynchronous queries
      const insertPromises = data.map((item) => {
        const { id, price, quantity } = item;
        return new Promise((resolve, reject) => {
          db.query(query, [orderId, id, quantity, price], (error, result) => {
            if (error) {
              reject(error); // If an error occurs, reject the promise
            } else {
              resolve(result); // Otherwise, resolve the promise
            }
          });
        });
      });
      await Promise.all(insertPromises);
      res.status(200).json({ message: 'Order items added successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to add order items', error });
    }
  };

  
  
  exports.sendsuccessMail = async (req, res) => {
    const { email, firstname, lastname, products, totalAmount, shippingAddress } = req.body; // Get details from the frontend
    
    try {
        const orderItems = products.map(product => {
            return `
            <div class="item-info">
                <span>${product.name}</span>
                <span>Quantity: ${product.quantity}</span>
                <span>$${product.price}</span>
            </div>`;
        }).join('');
        
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
                                <span>#123456</span> <!-- Add dynamic order ID here -->
                            </div>
                            <div class="order-info">
                                <span>Order Date:</span>
                                <span>${new Date().toLocaleDateString()}</span> <!-- Current Date -->
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
                                <span>${email}</span>
                            </div>
                        </div>

                        <div class="shipping-address">
                            <h2>Shipping Address</h2>
                            <p>${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.pincode}, ${shippingAddress.country}</p>
                        </div>

                        <div class="order-summary">
                            <h2>Order Summary</h2>
                            ${orderItems}
                            <div class="item-info total">
                                <span>Total:</span>
                                <span>$${totalAmount}</span> <!-- Dynamic total -->
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
            to: email, // Dynamic customer email
            subject: 'Thank you for ordering from us!',
            html: html, // Order confirmation email with details
        };

        await transporter.sendMail(adminMailOptions);  // Send email to Admin
        await transporter.sendMail(userMailOptions);    // Send email to User

        res.status(200).json({ message: 'Order placed successfully, confirmation emails sent!' });
    } catch (error) {
        console.error('Error in sendsuccessMail:', error);
        res.status(500).json({ message: 'Error submitting order and sending email', error });
    }
};
 
