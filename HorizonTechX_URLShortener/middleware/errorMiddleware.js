const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  if (statusCode === 200) statusCode = 500;

  const response = {
    success: false,
    error: {
      message: err.message || "Internal Server Error",
      statusCode,
    },
  };

  if (process.env.NODE_ENV !== "production") {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
