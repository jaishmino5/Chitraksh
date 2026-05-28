const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    // Check if the URI contains the placeholder password
    if (process.env.MONGO_URI && process.env.MONGO_URI.includes('<db_password>')) {
      console.warn('⚠️  [CHITRAKSH VLM] MongoDB Atlas password placeholder <db_password> detected.');
      console.warn('⚠️  Backend will run in in-memory Sandbox Mode. Users will register in RAM storage.');
      return;
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 4000 // Fast timeout
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    isConnected = true;
  } catch (error) {
    console.warn(`⚠️  [CHITRAKSH VLM] MongoDB Connection Failed: ${error.message}`);
    console.warn('⚠️  Backend will fall back to in-memory Sandbox Mode (registers will store in RAM).');
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
