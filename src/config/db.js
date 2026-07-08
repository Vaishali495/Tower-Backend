// Configure Mongoose to use strict query filtering
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
    mongoose.set("strictQuery", true);

    await mongoose.connect(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;