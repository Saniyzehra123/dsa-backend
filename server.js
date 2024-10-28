// server.js
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./config/db');
const productRoutes = require('./routes/products.js');
const userRoutes = require('./routes/users.js');
const cartRoutes = require('./routes/cart.js');
const orderRoutes = require('./routes/order.js')
const wishlistRoutes = require('./routes/wishListRoute.js');
const shippingRoutes =require('./routes/shippingRoute.js');
const paymentgatewayRoutes = require('./routes/paymentgatewayRoutes.js');
const cookieParser = require('cookie-parser');
const ApiError = require('./utils/ApiError.js');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const addressRoutes = require('./routes/addressRoutes');
const contactRoutes = require('./routes/contactRoutes.js');
const paymentRoutes =require('./routes/paymentRoute.js')
const adminItem = require("./routes/adminItem.js")

require('dotenv').config();

 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(bodyParser.json());  
app.use(cookieParser());

// Routes
app.use('/api/products', productRoutes);
// app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order',orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/paymentgateway', paymentgatewayRoutes);
app.use('/api/address', addressRoutes);
app.use('/api', contactRoutes);
app.use('/api/adminitem', adminItem)

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message });
  } else {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Starting the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
