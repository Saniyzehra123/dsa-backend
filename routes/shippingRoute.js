 // routesRoutes.js
const express = require("express");
const shippingController = require("../controllers/shippingController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Create a new shipping entry
router.post("/", asyncHandler(shippingController.createShipping));

// Get shipping details for an order
router.get("/:id", asyncHandler(shippingController.getShipping));

// Update shipping status
router.put("/:id", asyncHandler(shippingController.updateShippingStatus));

module.exports = router;
