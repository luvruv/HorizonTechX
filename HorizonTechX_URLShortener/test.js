require("dotenv").config();
const mongoose = require("mongoose");

console.log(process.env.MONGO_URI);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("CONNECTED SUCCESSFULLY");
        process.exit(0);
    })
    .catch((err) => {
        console.error("ERROR:");
        console.error(err);
        process.exit(1);
    });