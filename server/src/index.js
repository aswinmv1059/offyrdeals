const app = require('./app');
const connectDb = require('./config/db');
const env = require('./config/env');
const ensureDefaultAccounts = require('./scripts/ensureDefaultAccounts');

const start = async () => {
  try {
    await connectDb();
    await ensureDefaultAccounts();
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
