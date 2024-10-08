const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const validator = require('validator');


// User Registration (no role)

exports.register = (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (!validator.isLength(password, { min: 6 })) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  if (!validator.isAlphanumeric(password)) {
    return res.status(400).json({ message: 'Password must contain letters and numbers' });
  }

  // Hash password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ message: 'Error hashing password' });

    console.log("hash",hashedPassword)
    const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    db.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) return res.status(400).json({ message: 'Email already exists' });
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
};

// User Login
exports.login = (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, result) => {
    if (err || result.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = result[0];
    console.log("user",user)
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, is_admin:user.is_admin }, process.env.JWT_SECRET, {
        expiresIn: '24h'
      });
     
      console.log("token",token)
      res.cookie('token', token, { httpOnly: true }).status(200).json({
        message: 'Logged in successfully',
        token
      });
    });
  });
};


// exports.adminLogin = (req, res) => {
//   const { email, password } = req.body;

  
//   if (!email || !password) {
//     return res.status(400).json({ message: 'All fields are required' });
//   }

//   if (!validator.isEmail(email)) {
//     return res.status(400).json({ message: 'Invalid email format' });
//   }

//   const sql = 'SELECT * FROM users WHERE email = ? AND is_admin = 1'; 
//   db.query(sql, [email], (err, result) => {
//     if (err || result.length === 0) {
//       return res.status(400).json({ message: 'Admin not found' });
//     }

//     const admin = result[0];
//     bcrypt.compare(password, admin.password, (err, isMatch) => {
//       if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

//       const token = jwt.sign({ id: admin.id, isAdmin: true }, process.env.JWT_SECRET, {
//         expiresIn: '1h'
//       });

//       res.cookie('adminToken', token, { httpOnly: true }).status(200).json({
//         message: 'Admin logged in successfully',
//         token
//       });
//     });
//   });
// };


exports.logout = (req, res) => {
  res.clearCookie('token').status(200).json({ message: 'Logged out successfully' });
};
