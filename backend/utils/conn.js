const mongoose = require('mongoose');

const connectMongo = async () => {
  const uri = process.env.MONGO_URI || 'your-mongodb-atlas-uri-here';
  console.log('[DEBUG] MONGO_URI:', uri); // Add this line
  try {
    await mongoose.connect(uri); // No options needed for modern drivers
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectMongo;