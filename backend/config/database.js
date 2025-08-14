const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (
      process.env.MONGODB_URI &&
      process.env.MONGODB_URI !== "your_mongodb_connection_string_here"
    ) {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } else {
      console.log("MongoDB URI not provided, running without database");
    }
  } catch (error) {
    console.error("Database connection error:", error.message);
    // Don't exit process, just log the error
    console.log("Continuing without database connection");
  }
};

module.exports = connectDB;
