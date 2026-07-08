const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const helmet = require("helmet");

const connectDB = require("./config/db");

const urlRouter = require("./routes/urlRoutes");
const notFound = require("./middleware/notFound");
const errorMiddleware = require("./middleware/errorMiddleware");

dotenv.config();

connectDB();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/v1/url", urlRouter);

app.use(notFound);
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});