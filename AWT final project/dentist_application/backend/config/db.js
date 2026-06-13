// backend/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Mongoose 7+ me options ki zarurat nahi
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1); // Server stop agar DB connect na ho
  }
};

module.exports = connectDB;