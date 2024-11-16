 

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const validator = require('validator');
const ApiError = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const nodemailer = require('nodemailer');
 

// Admin Register
// Admin Register
exports.adminRegister = (req, res) => {
  const { admin_name, email, password } = req.body;

  // Validate input
  if (!admin_name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
  }

  if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
  }

  // Check if the admin already exists in the database
  const sql = 'SELECT * FROM admins WHERE email = ?';
  db.query(sql, [email], (err, result) => {
      if (err) {
          return res.status(500).json({ message: 'Error checking for existing admin' });
      }

      if (result.length > 0) {
          return res.status(400).json({ message: 'Admin already exists with this email' });
      }

      // Hash the password using bcrypt
      bcrypt.hash(password, 10, (err, hashedPassword) => {
          if (err) {
              return res.status(500).json({ message: 'Error hashing password' });
          }

          // Insert the new admin into the database
          const insertAdminSql = 'INSERT INTO admins (admin_name, email, admin_password) VALUES (?, ?, ?)';
          db.query(insertAdminSql, [admin_name, email, hashedPassword], (err, result) => {
              if (err) {
                  return res.status(500).json({ message: 'Error inserting admin into database' });
              }

              // Optionally, create a JWT token after successful registration
              const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: '1h' });

              // Send the response with both admin and token
              res.status(201).json({
                  message: 'Admin registered successfully',
                  admin: { id: result.insertId, admin_name, email },
                  token
              });
          });
      });
  });
};




// Admin Login
exports.adminLogin = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
  }

  if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
  }

  // Fetch the admin from the database using the email (admin must be manually added)
  const sql = 'SELECT * FROM admins WHERE email = ?';
  db.query(sql, [email], (err, result) => {
      if (err || result.length === 0) {
          return res.status(400).json({ message: 'Admin not found' });
      }

      const admin = result[0];
      
      // Compare the provided password with the hashed password stored in the DB
      bcrypt.compare(password, admin.admin_password, (err, isMatch) => {
          if (err || !isMatch) return res.status(400).json({ message: 'Invalid credentials' });

          // If credentials match, create and send JWT token
          const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

          // Send response with both admin and token
          res.status(200).json({
              message: 'Admin logged in successfully',
              admin: { id: admin.id, admin_name: admin.admin_name, email: admin.email,token:token },
               
          });
      });
  });
};



// Admin Forgot Password
exports.adminForgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ message: 'A valid email is required' });
    }

    const sql = 'SELECT * FROM admins WHERE email = ?';
    db.query(sql, [email], async (err, result) => {
        if (err || result.length === 0) {
            return res.status(400).json({ message: 'Admin with this email does not exist' });
        }

        const admin = result[0];
        const resetToken = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const resetLink = `http://localhost:3000/admin/reset-password?token=${resetToken}`;

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == '465',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Admin Password Reset Request',
            html: `
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetLink}">Reset Your Password</a>
                <p>If you did not request this, please ignore this email.</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Password reset link sent to email' });
    });
};

// Admin Reset Password
exports.adminResetPassword = (req, res) => {
    const { token, password, resetPassword } = req.body;

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

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(400).json({ message: 'Invalid or expired token' });

        const adminId = decoded.id;

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ message: 'Error hashing password' });

            const updatePasswordSql = 'UPDATE admins SET admin_password = ? WHERE id = ?';
            db.query(updatePasswordSql, [hashedPassword, adminId], (err) => {
                if (err) return res.status(500).json({ message: 'Error updating password' });

                res.status(200).json({ message: 'Password reset successfully' });
            });
        });
    });
};
