// utils/ApiError.js
class ApiError{
  constructor(statusCode, message) {
    // super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

module.exports= ApiError;
