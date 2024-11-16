const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const validator = require('validator');
const ApiError = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const nodemailer = require('nodemailer');

// Customer Registration
exports.register = (req, res) => {
    const { username, phone, email, password } = req.body;
//    console.log("req",req.body)
    // Validate input
    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }

    if (email && !validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!validator.isLength(password, { min: 6 })) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ message: 'Error hashing password' });

        const sql = 'INSERT INTO customers (username, phone, email, password) VALUES (?, ?, ?, ?)';
        db.query(sql, [username, phone, email, hashedPassword], (err, result) => {
            if (err) return res.status(400).json({ message: 'Error registering customer' });
            res.status(201).json({ message: 'Customer registered successfully',userId:result.insertId });
        });
    });
};

// Customer Login
exports.login = (req, res) => {
    const { email, password } = req.body;
    // console.log("password", password,email)
    // Validate input
    if (email.length==0 || password.length==0) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    const sql = 'SELECT * FROM customers WHERE email = ? ORDER BY id DESC';
    db.query(sql, [email], (err, result) => {
        if (err || result.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        // console.log("res", result[0])
        const customer = result[0];
        bcrypt.compare(password, customer.password, (err, isMatch) => {
            if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

            // Generate a JWT token
            const token = jwt.sign({ id: customer.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

            // Update auth_token in the database
            const updateTokenSql = 'UPDATE customers SET auth_token = ? WHERE id = ?';
            db.query(updateTokenSql, [token, customer.id], (err) => {
                if (err) return res.status(500).json({ message: 'Error saving token' });

                res.cookie('token', token, { httpOnly: true }).status(200).json({
                    message: 'Logged in successfully',
                    token
                });
            });
        });
    });
};

// Reset Password
exports.resetPassword = (req, res) => {
    // const { token } = req.query; // Get token from query parameters
    const { token, password, resetPassword } = req.body;

    // Validate input
    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }

    if (!password || !resetPassword) {
        return res.status(400).json({ message: 'Both password fields are required' });
    }

    if (password !== resetPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (!validator.isLength(password, { min: 6 })) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(400).json({ message: 'Invalid or expired token' });

        const customerId = decoded.id;

        // Hash the new password
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ message: 'Error hashing password' });

            // Update the password in the database
            const updatePasswordSql = 'UPDATE customers SET password = ?, auth_token = NULL WHERE id = ?';
            db.query(updatePasswordSql, [hashedPassword, customerId], (err) => {
                if (err) return res.status(500).json({ message: 'Error updating password' });

                res.status(200).json({ message: 'Password reset successfully' });
            });
        });
    });
};


// Forgot Password

// Forgot Password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ message: 'A valid email is required' });
        }

        // Check if the email exists in the database
        const sql = 'SELECT * FROM customers WHERE email = ?';
        db.query(sql, [email], async (err, result) => {
            if (err || result.length === 0) {
                return res.status(400).json({ message: 'Customer with this email does not exist' });
            }

            const customer = result[0];

            // Generate a reset token (JWT token)
            const resetToken = jwt.sign({ id: customer.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

            // Construct the reset link
            const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

            // Set up Nodemailer for sending emails
            let transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: process.env.SMTP_PORT == '465',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            // Email options with HTML button
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Password Reset Request',
                html: `
                    <p>You requested a password reset. Click the button below to reset your password:</p>
                    <a href="${resetLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Your Password</a>
                    <p>If you did not request this, please ignore this email.</p>
                `,
            };

            // Send email
            await transporter.sendMail(mailOptions);

            res.status(200).json({ message: 'Password reset link sent to email' });
        });
    } catch (error) {
        console.log('Error in forgot password', error);
        res.status(500).json({ message: 'Server error' });
    }
};
 
exports.customerLoginWithOtp = async (req, res) => {
    const { email, otpCode } = req.body;  // Extract email from request body

    // HTML template with OTP dynamically inserted
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>One-Time Password</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border: 1px solid #ddd;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 10px 0;
            background-color: #4CAF50;
            color: #ffffff;
        }
        .content {
            padding: 20px;
            text-align: center;
        }
        .otp {
            font-size: 24px;
            font-weight: bold;
            color: #4CAF50;
            margin: 20px 0;
        }
        .message {
            font-size: 16px;
            color: #555;
        }
        .footer {
            text-align: center;
            padding: 10px 0;
            font-size: 12px;
            color: #aaa;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Your One-Time Password (OTP)</h2>
        </div>
        <div class="content">
            <p class="message">Use the OTP below to complete your verification process:</p>
            <div class="otp">${otpCode}</div>
            <p class="message">This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Your Company. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    try {
        // Set up Nodemailer transporter
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            secure: parseInt(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        // Email to User with HTML content
        const userMailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your One-Time Password (OTP)',
            html: html,  // Use html with OTP inserted
        };

        // Send email to the user
        await transporter.sendMail(userMailOptions);

        res.status(200).json({ message: 'OTP sent successfully!' });
    } catch (error) {
        console.error('Error in sending OTP:', error);
        res.status(500).json({ message: 'Error sending OTP', error });
    }
};


exports.getCustomerDetails=async(req, res)=>{
    const customerId = req.params.customer_id;
    // console.log("address",customerId);
    try {
        let query =`SELECT username as firstname, lastname, email, phone, birthdate, gender, id FROM customers WHERE id = ?`
        db.query(query, [customerId], (err, results)=>{
            if(err){
                return new ApiError(500,   `Error in geting customer:${err}`)
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'No addresses found for this customer' });
            }
            return res.status(200).json({ data: results[0], message: 'Customer retrieved successfully' });
        })
    } catch (error) {
        return new ApiError(400, `Error fetching addresses: ${err.message}`)
    }
}




// Update Customer Details (PATCH)
exports.updateCustomerProfile = async (req, res, next) => {
    const { id, firstname, lastname, email, phone, birthdate, gender } = req.body;
    let customerId = req.params.customer_id;

    // Log customer_id to check if it is being received
    // console.log("Received customer_id:",  req.body);

    // Ensure customer_id is provided
    if (!customerId) {
        return res.status(400).json({ message: 'Customer ID is required' });
    }

    const query = `
        UPDATE customers 
        SET username = ?, 
            lastname = ?, 
            email = ?, 
            phone = ?, 
            birthdate = ?, 
            gender = ? 
        WHERE id = ?`;

    try {
        db.query(query, [firstname, lastname, email, phone, birthdate, gender, customerId], (err, result) => {
            // console.log("error", err, result)
            if (err) {
                return next(new ApiError(500, `Error updating customer profile: ${err.message}`));
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: `Customer not found with ID: ${customerId}` });
            }
            return res.status(200).json(
                new ApiResponse(200,  {id:id}, 'Customer profile updated successfully')
            );
        });
    } catch (error) {
        next(new ApiError(500, `Internal server error: ${error.message}`));
    }
};
 