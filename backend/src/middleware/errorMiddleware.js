const AppError = require("../utils/AppError");

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error(err);
  }

  const message = statusCode >= 500 ? "Something went wrong. Please try again later." : err.message;

  res.status(statusCode).json({ message });
}

module.exports = { notFound, errorHandler };
