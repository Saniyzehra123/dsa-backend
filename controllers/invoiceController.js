// controllers/invoiceController.js
const db = require('../config/db.js');
const ApiError = require('../utils/ApiError.js');
const { ApiResponse } = require('../utils/ApiResponse.js');

// Create a new invoice
exports.createInvoice = async (req, res, next) => {
  const { order_id, user_id, amount, tax, discount, total_amount } = req.body;
  try {
    const query = `
      INSERT INTO invoices (order_id, user_id, amount, tax, discount, total_amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const queryParams = [order_id, user_id, amount, tax, discount, total_amount];

    db.query(query, queryParams, (err, result) => {
      if (err) {
        return next(new ApiError(500, `Failed to create invoice: ${err.message}`));
      }
      return res.status(201).json(
        new ApiResponse(201, { invoiceId: result.insertId }, 'Invoice created successfully')
      );
    });
  } catch (error) {
    next(new ApiError(500, `Error creating invoice: ${error.message}`));
  }
};

// Retrieve invoice details based on order_id or user_id
exports.getInvoice = async (req, res, next) => {
  const { order_id, user_id } = req.query;
  try {
    let query = `
      SELECT 
        i.invoice_id,
        i.order_id,
        i.user_id,
        i.amount,
        i.tax,
        i.discount,
        i.total_amount,
        o.created_at AS order_date,
        u.username AS customer_name,
        u.email AS customer_email,
        a.address,
        a.city,
        a.state,
        a.pincode,
        a.country
      FROM invoices i
      INNER JOIN orders o ON o.id = i.order_id
      INNER JOIN users u ON u.id = i.user_id
      INNER JOIN addresses a ON a.user_id = u.id
      WHERE i.order_id = ?
    `;
    const queryParams = [order_id];

    if (user_id) {
      query += ' AND i.user_id = ?';
      queryParams.push(user_id);
    }

    db.query(query, queryParams, (err, results) => {
      if (err) {
        return next(new ApiError(500, `Database query failed: ${err.message}`));
      }
      if (results.length === 0) {
        return next(new ApiError(404, 'No invoice found for the specified order or user'));
      }
      return res.status(200).json(
        new ApiResponse(200, results[0], 'Invoice retrieved successfully')
      );
    });
  } catch (error) {
    next(new ApiError(500, `Error fetching invoice: ${error.message}`));
  }
};

