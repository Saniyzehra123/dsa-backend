const multer = require('multer');
const path = require('path');

// Set storage options
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads'; // Or any desired path
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to the filename
  }
});

// Configure multer middleware
const uploadMidleware = multer({ storage });

module.exports = uploadMidleware.single('image'); // Export as a single middleware
