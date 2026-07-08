const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const connectDB = require("./config/db");
const urlRouter = require("./routes/urlRoutes");
const notFound = require("./middleware/notFound");
const errorMiddleware = require("./middleware/errorMiddleware");

// Load Environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(morgan("dev")); // HTTP request logger
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, "public")));

// Bind API and Redirect Routes
app.use("/", urlRouter);

// Fallback middlewares
app.use(notFound);
app.use(errorMiddleware);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open frontend at: http://localhost:${PORT}`);
});