const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const validator = require('validator');
const ApiError = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');

// Customer Registration
exports.register = (req, res) => {
    const { username, phone, email, password } = req.body;

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
            res.status(201).json({ message: 'Customer registered successfully' });
        });
    });
};

// Customer Login
exports.login = (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    const sql = 'SELECT * FROM customers WHERE email = ?';
    db.query(sql, [email], (err, result) => {
        if (err || result.length === 0) {
            return res.status(400).json({ message: 'Customer not found' });
        }

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

exports.resetPassword = (req, res) => {
    try {
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

        // Find the customer by auth token
        db.query('SELECT * FROM customers WHERE auth_token = ?', [token], (err, result) => {
            if (err || result.length === 0) {
                return res.status(400).json({ message: 'Invalid token or customer not found' });
            }

            const customer = result[0];

            // Hash the new password
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) return res.status(500).json({ message: 'Error hashing password' });

                // Update the password in the database
                const updatePasswordSql = 'UPDATE customers SET password = ? WHERE id = ?';
                db.query(updatePasswordSql, [hashedPassword, customer.id], (err) => {
                    if (err) return res.status(500).json({ message: 'Error updating password' });

                    // Optionally, invalidate the old token by setting it to null
                    const clearTokenSql = 'UPDATE customers SET auth_token = NULL WHERE id = ?';
                    db.query(clearTokenSql, [customer.id], (err) => {
                        if (err) return res.status(500).json({ message: 'Error clearing token' });

                        res.status(200).json({ message: 'Password reset successfully' });
                    });
                });
            });
        });
    } catch (error) {
        console.log('Error resetting password', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Forgot Password
exports.forgotPassword = (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ message: 'A valid email is required' });
        }

        // Check if the email exists in the database
        const sql = 'SELECT * FROM customers WHERE email = ?';
        db.query(sql, [email], (err, result) => {
            if (err || result.length === 0) {
                return res.status(400).json({ message: 'Customer with this email does not exist' });
            }

            const customer = result[0];

            // Generate a reset token (JWT token)
            const resetToken = jwt.sign({ id: customer.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

            // Simulate sending an email with the reset link (replace with actual email sending logic)
            const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

            // For testing purposes, return the link in the response (in production, send via email)
            res.status(200).json({ message: 'Password reset link sent to email', resetLink });
        });
    } catch (error) {
        console.log('Error in forgot password', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCustomerDetails=async(req, res)=>{
    const customerId = req.params.customer_id;
    console.log("address",customerId);
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
    console.log("Received customer_id:",  req.body);

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
            console.log("error", err, result)
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


// exports.forgotPassword = (req, res) => {
//     try {
//         const { email } = req.body;

//         // Validate email
//         if (!email || !validator.isEmail(email)) {
//             return res.status(400).json({ message: 'A valid email is required' });
//         }

//         // Check if the email exists in the database
//         const sql = 'SELECT * FROM customers WHERE email = ?';
//         db.query(sql, [email], (err, result) => {
//             if (err || result.length === 0) {
//                 return res.status(400).json({ message: 'Customer with this email does not exist' });
//             }

//             const customer = result[0];

//             // Generate a reset token (JWT token)
//             const resetToken = jwt.sign({ id: customer.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

//             // Simulate sending an email with the reset link (replace with actual email sending logic)
//             const resetLink = http://yourwebsite.com/reset-password?token=${resetToken};

//             // For testing purposes, return the link in the response (in production, send via email)
//             res.status(200).json({ message: 'Password reset link sent to email', resetLink });
//         });
//     } catch (error) {
//         console.log('Error in forgot password', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };

// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const db = require('../config/db');
// const validator = require('validator');

// // Customer Registration
// exports.register = (req, res) => {
//     const { username, phone, email, password } = req.body;

//     // Validate input
//     if (!password) {
//         return res.status(400).json({ message: 'Password is required' });
//     }

//     if (email && !validator.isEmail(email)) {
//         return res.status(400).json({ message: 'Invalid email format' });
//     }

//     if (!validator.isLength(password, { min: 6 })) {
//         return res.status(400).json({ message: 'Password must be at least 6 characters long' });
//     }

//     // Check if email or phone already exists
//     const checkUserSql = 'SELECT * FROM customers WHERE email = ? OR phone = ?';
//     db.query(checkUserSql, [email, phone], (err, result) => {
//         if (err) {
//             return res.status(500).json({ message: 'Database error' });
//         }
        
//         if (result.length > 0) {
//             return res.status(400).json({ message: 'User with this email or phone already exists' });
//         }

//         // Hash password and insert new user if no duplicate found
//         bcrypt.hash(password, 10, (err, hashedPassword) => {
//             if (err) return res.status(500).json({ message: 'Error hashing password' });

//             const insertUserSql = 'INSERT INTO customers (username, phone, email, password) VALUES (?, ?, ?, ?)';
//             db.query(insertUserSql, [username, phone, email, hashedPassword], (err, result) => {
//                 if (err) return res.status(500).json({ message: 'Error registering customer' });
//                 res.status(201).json({ message: 'Customer registered successfully' });
//             });
//         });
//     });
// };

// // Customer Login
// exports.login = (req, res) => {
//     const { email, password } = req.body;

//     // Validate input
//     if (!email || !password) {
//         return res.status(400).json({ message: 'All fields are required' });
//     }

//     if (!validator.isEmail(email)) {
//         return res.status(400).json({ message: 'Invalid email format' });
//     }

//     const sql = 'SELECT * FROM customers WHERE email = ?';
//     db.query(sql, [email], (err, result) => {
//         if (err || result.length === 0) {
//             return res.status(400).json({ message: 'Customer not found' });
//         }

//         const customer = result[0];
//         bcrypt.compare(password, customer.password, (err, isMatch) => {
//             console.log("custom",isMatch)

//             if (!isMatch){
//                 return res.status(400).json({ message: 'Invalid credentials' });
//             }

//             // Generate a JWT token
//             const token = jwt.sign({ id: customer.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

//             // Update auth_token in the database
//             const updateTokenSql = 'UPDATE customers SET auth_token = ? WHERE id = ?';
//             db.query(updateTokenSql, [token, customer.id], (err) => {
//                 if (err) return res.status(500).json({ message: 'Error saving token' });

//                 res.cookie('token', token, { httpOnly: true }).status(200).json({
//                     message: 'Logged in successfully',
//                     token
//                 });
//             });
//         });
//     });
// };



// // Customer Logout
// exports.logout = (req, res) => {
//     const token = req.cookies.token;

//     if (!token) {
//         return res.status(400).json({ message: 'No user is logged in' });
//     }

//     // Verify and decode the token to get the user's ID
//     jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//         if (err) {
//             return res.status(400).json({ message: 'Invalid token' });
//         }

//         // Clear the token from the database
//         const clearTokenSql = 'UPDATE customers SET auth_token = NULL WHERE id = ?';
//         db.query(clearTokenSql, [decoded.id], (err) => {
//             if (err) return res.status(500).json({ message: 'Error clearing token' });

//             // Clear the token from cookies
//             res.clearCookie('token').status(200).json({
//                 message: 'Logged out successfully'
//             });
//         });
//     });
// };



