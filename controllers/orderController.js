// controllers/orderController.js
const db = require('../config/db.js');
const ApiError = require('../utils/ApiError.js');
const { ApiResponse } = require('../utils/ApiResponse.js');

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
        ca.address,
        ca.city,
        ca.state,
        ca.pincode,
        ca.country,
        i.main_image_url,
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
      INNER JOIN payment_methods pm ON pm.id = p.payment_method_id
      LEFT JOIN OrderTotals ot ON ot.order_id = o.id
      WHERE c.id = ?
    `;

    const queryParams = [customer_id];

    if (order_id) {
      query += ' AND o.id = ?';
      queryParams.push(order_id);
    }

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
  console.log("orders", req.params);
  
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
          ca.address,
          ca.city,
          ca.state,
          ca.pincode,
          ca.country,
          ot.total_quantity,
          ot.total_amount,
          ot.total_items,
          i.main_image_url,
          oi.price,
          oi.quantity
      FROM orders o
      INNER JOIN order_items oi ON oi.order_id = o.id
      INNER JOIN items i ON i.id = oi.item_id
      INNER JOIN customers c ON c.id = o.customer_id
      LEFT JOIN customers_address ca ON ca.customer_id = c.id
      INNER JOIN OrderTotals ot ON ot.order_id = o.id
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
          address: results[0].address,
          city: results[0].city,
          state: results[0].state,
          pincode: results[0].pincode,
          country: results[0].country,
        },
        total_quantity: results[0].total_quantity,
        total_amount: results[0].total_amount,
        total_items: results[0].total_items,
        order_items: results.map(item => ({
          order_item_id: item.order_item_id,
          main_image_url: item.main_image_url,
          price: item.price,
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
    console.log("orders", req.body)

    try {
        const query=`insert into orders(customer_id, delivery_address, billing_address, order_status_id) values(?,?,?,?)`
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
  



// const db = require('../config/db');

// const listAllProducts = (req, res) => {
//     const query = `
//         SELECT
//         o.id as order_id,
//         oi.item_id,
//         i.name as item_name,
//         oi.quantity,
//         oi.price,
//         c.username as customer_name,
//         ca.address,
//         ca.city,
//         ca.state,
//         ca.pincode,
//         ca.country
//         FROM orders o
//         INNER JOIN order_items oi ON oi.order_id = o.id
//         INNER JOIN items i ON i.id = oi.item_id
//         INNER JOIN customers c ON c.id = o.customer_id
//         INNER JOIN customers_address ca ON ca.id = c.address_id;
//     `;

//     db.query(query, (err, results) => {
//         if (err) {
//             return res.status(500).json({ error: 'Database query failed', details: err });
//         }
//         res.json(results);
//     });
// };

// module.exports = {
//     listAllProducts
// };
