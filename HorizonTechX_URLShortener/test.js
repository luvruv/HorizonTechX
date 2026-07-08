require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");

// Set DNS servers to Google's public DNS to ensure SRV record resolution works properly
dns.setServers(["8.8.8.8", "8.8.4.4"]);

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