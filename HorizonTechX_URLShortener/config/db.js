const mongoose = require("mongoose");

const connectDB = async () => {
    try {
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