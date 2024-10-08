const db = require("../config/db");

// Create a new shipping entry
const createShipping = async (order_id, customer_id, shipping_method_id, shipping_cost, order_status_id) => {
  try {
    const result = await db.query(
      `INSERT INTO shipping (order_id, customer_id, shipping_method_id, shipping_cost, order_status_id)
       VALUES (?, ?, ?, ?, ?)`,
      [order_id, customer_id, shipping_method_id, shipping_cost, order_status_id]
    );
    return result.insertId;
  } catch (error) {
    throw error;
  }
};

// Get shipping details for an order
const getShippingByOrderId = async (order_id) => {
  try {
    const [shippingDetails] = await db.query(
      `SELECT * FROM shipping WHERE order_id = ?`,
      [order_id]
    );
    console.log("shp", shippingDetails)
    return shippingDetails;
  } catch (error) {
    console.error(`Error fetching shipping for order ID: ${order_id}`, error);
    throw new ApiError(500, "Error fetching shipping details");
  }
};


// Update shipping status
const updateShippingStatus = async (id, order_status_id) => {
  try {
    const result = await db.query(
      `UPDATE shipping SET order_status_id = ? WHERE id = ?`,
      [order_status_id, id]
    );
    return result.affectedRows;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createShipping,
  getShippingByOrderId,
  updateShippingStatus,
};
