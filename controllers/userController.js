 // controllers/userController.js
const db = require('../config/db');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Number of salt rounds for bcrypt hashing

// Get all users
exports.getAllUsers = (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send('Database error');
        }
        res.json(results);
    });
};

// Register new user with hashed password
exports.registerUser = async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    try {
        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the new user into the database
        const sql = 'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
        db.query(sql, [first_name, last_name, email, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).send('Database error');
            }
            res.status(201).send('User registered');
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).send('Error registering user');
    }
};

// User login with password validation
exports.loginUser = (req, res) => {
    const { email, password } = req.body;

    // Find the user by email
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).send('Invalid credentials');
        }

        const user = results[0];

        try {
            // Compare the hashed password with the plain password
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).send('Invalid credentials');
            }

            res.json({ message: 'Login successful', user });
        } catch (error) {
            console.error('Error validating password:', error);
            res.status(500).send('Error logging in');
        }
    });
};
