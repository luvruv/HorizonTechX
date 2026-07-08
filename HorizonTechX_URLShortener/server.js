const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const urlRouter = require("./routes/urlRoutes");

// Load Environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, "public")));

// Bind API and Redirect Routes
app.use("/", urlRouter);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open frontend at: http://localhost:${PORT}`);
});