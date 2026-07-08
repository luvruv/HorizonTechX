const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
    try {
        // Set DNS servers to Google's public DNS to ensure SRV record resolution works properly
        dns.setServers(["8.8.8.8", "8.8.4.4"]);

        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log("ERROR NAME:", error.name);
        console.log("ERROR MESSAGE:", error.message);
        console.log("FULL ERROR:", error);
        process.exit(1);
    }
};

module.exports = connectDB;