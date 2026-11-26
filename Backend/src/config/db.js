const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the MONGODB_URI environment variable.
 * Throws if the connection fails so the caller can decide how to handle startup.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
}

module.exports = { connectDB };
