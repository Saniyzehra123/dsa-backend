// controllers/orderController.js
const db = require('../config/db.js');
const ApiError = require('../utils/ApiError.js');
const { ApiResponse } = require('../utils/ApiResponse.js');

// Controller function to list all products with order details
exports.listAllProducts = async (req, res, next) => {
    try {
        const query = `   
                SELECT
                o.id as order_id,
                oi.item_id,
                oi.quantity,
                oi.price,
                c.username as customer_name,
                ca.address,
                ca.city,
                ca.state,
                ca.pincode,
                ca.country
                FROM orders o
                INNER JOIN order_items oi ON oi.order_id = o.id
                INNER JOIN items i ON i.id = oi.item_id
                INNER JOIN customers c ON c.id = o.customer_id
               INNER JOIN customers_address ca ON ca.customer_id = c.id
                WHERE 1=1;
        `;

        db.query(query, (err, results) => {
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
