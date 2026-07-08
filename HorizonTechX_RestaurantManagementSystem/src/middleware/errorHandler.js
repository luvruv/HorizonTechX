// src/middleware/errorHandler.js
/**
 * Centralized error handler.
 * Converts Sequelize and JWT errors into clean HTTP responses.
 * All other errors fall back to 500.
 */
module.exports = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl} →`, err.message);

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // --- Sequelize Errors ---
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    const field = err.errors?.[0]?.path || 'field';
    const value = err.errors?.[0]?.value || '';
    message = `A record with this ${field} ("${value}") already exists`;
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Related record not found — invalid foreign key reference';
  } else if (err.name === 'SequelizeDatabaseError') {
    statusCode = 400;
    message = 'Database error — please check your request data';
    if (process.env.NODE_ENV !== 'production') {
      message = `Database error: ${err.message}`;
    }
  }

  // --- JWT Errors ---
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token — please log in again';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired — please log in again';
  }

  // --- Don't leak stack traces in production ---
  const response = {
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
  };
  if (errors) response.errors = errors;
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
