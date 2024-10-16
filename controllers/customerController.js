const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const validator = require('validator');

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

    // Check if email or phone already exists
    const checkUserSql = 'SELECT * FROM customers WHERE email = ? OR phone = ?';
    db.query(checkUserSql, [email, phone], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (result.length > 0) {
            return res.status(400).json({ message: 'User with this email or phone already exists' });
        }

        // Hash password and insert new user if no duplicate found
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ message: 'Error hashing password' });

            const insertUserSql = 'INSERT INTO customers (username, phone, email, password) VALUES (?, ?, ?, ?)';
            db.query(insertUserSql, [username, phone, email, hashedPassword], (err, result) => {
                if (err) return res.status(500).json({ message: 'Error registering customer' });
                res.status(201).json({ message: 'Customer registered successfully' });
            });
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
            console.log("custom",isMatch)

            if (!isMatch){
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Generate a JWT token
            const token = jwt.sign({ id: customer.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

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



// Customer Logout
exports.logout = (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(400).json({ message: 'No user is logged in' });
    }

    // Verify and decode the token to get the user's ID
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        // Clear the token from the database
        const clearTokenSql = 'UPDATE customers SET auth_token = NULL WHERE id = ?';
        db.query(clearTokenSql, [decoded.id], (err) => {
            if (err) return res.status(500).json({ message: 'Error clearing token' });

            // Clear the token from cookies
            res.clearCookie('token').status(200).json({
                message: 'Logged out successfully'
            });
        });
    });
};



