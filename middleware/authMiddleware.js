const jwt = require('jsonwebtoken');

// Verify token for users
exports.verifyToken = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization'];

  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

// Verify token for admins
exports.verifyAdminToken = (req, res, next) => {
  const token = req.cookies.adminToken || req.headers['authorization'];

  if (!token) return res.status(401).json({ message: 'Admin access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: 'Not an admin' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid admin token' });
  }
};





















// import { ApiError } from "../utils/apiError.js";
// import Jwt from "jsonwebtoken";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import db from "../config/db.js";  

// export const verifyJWT = asyncHandler(async (req, _, next) => {
//   try {
//     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
//     if (!token) {
//       throw new ApiError(401, "Unauthorized request");
//     }

//     const decodedToken = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

//     // Query the MySQL database to find the user
//     const [user] = await db.query(
//       "SELECT id, username, email FROM users WHERE id = ? AND is_active = 1",
//       [decodedToken._id]  
//     );

//     if (!user) {
//       throw new ApiError(401, "Invalid token");
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     throw new ApiError(401, error?.message || "Invalid access token");
//   }
// });
