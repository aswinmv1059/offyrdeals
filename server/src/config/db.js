const mongoose = require('mongoose');
const env = require('./env');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

const connectDb = async () => {
  const useInMemory = process.env.USE_INMEMORY_DB === 'true';
  const mongoUri = useInMemory
    ? await (async () => {
        memoryServer = await MongoMemoryServer.create();
        return memoryServer.getUri();
      })()
    : env.mongoUri;

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected (${useInMemory ? 'in-memory' : 'external'})`);
};

module.exports = connectDb;
