// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const ApiError = require('../utils/ApiError');

// const app = express();
 
// exports.imageUpload = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).send('No file uploaded');
//     } else {
       
//       // const fileUrl = `https://api.dsafashionwear.com/api/images/${req.file.filename}`;
//       const fileUrl = `${req.file.filename}`;
//       console.log("file",fileUrl)
//       return res.status(200).json({
//         status: 200,
//         fileUrl,
//         message: "File uploaded successfully",
//       });
//     }
//   } catch (error) {
//     return res.status(500).json({
//       status: 500,
//       message: `Error: ${error.message}`,
//     });
//   }
// };

const multer = require("multer");
const express = require("express");
const router = express.Router();

const upload = multer({ dest: '../assets/image' }); // Adjust destination if needed

// imageUploadController.js
exports.imageUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `/images/${req.file.filename}`;
    return res.status(200).json({
      status: 200,
      fileUrl,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error processing file upload:', error.message);
    res.status(500).json({
      status: 500,
      message: `Error: ${error.message}`
    });
  }
};

module.exports = router;

 
 
  

 