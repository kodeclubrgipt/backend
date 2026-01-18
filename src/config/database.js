const mongoose = require('mongoose');
const { env } = require('./env');

const MONGODB_URI = env.MONGODB_URI;

// MongoDB connection options
const mongooseOptions = {
  // Use the new URL parser
  // Remove deprecated options for Mongoose 8.x
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`📦 Connected to MongoDB database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Get connection status
const getConnectionStatus = () => {
  return {
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
  };
};

module.exports = {
  connectDB,
  getConnectionStatus,
  default: mongoose,
};
