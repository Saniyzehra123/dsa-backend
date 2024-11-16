// middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
    // console.error(err.stack);  
    res.status(500).json({ 
        success: false, 
        message: 'An error occurred, please try again later.', 
        error: err.message 
    });
};

module.exports = errorHandler;
