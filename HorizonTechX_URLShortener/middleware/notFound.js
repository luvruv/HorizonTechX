// Route Fallback Handler for Undefined Endpoints
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - Path: ${req.originalUrl} (${req.method})`);
    res.status(404);
    next(error);
};

module.exports = notFound;
