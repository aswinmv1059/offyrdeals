const mongoose = require('mongoose');
const env = require('./env');

const connectDb = async () => {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
  console.log('MongoDB connected');
};

module.exports = connectDb;
