// Global Error Handling Middleware
const errorMiddleware = (err, req, res, next) => {
    // If headers are already sent, delegate to standard Express handler
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
};

module.exports = errorMiddleware;
