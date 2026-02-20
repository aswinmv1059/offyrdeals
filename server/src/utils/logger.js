const Log = require('../models/Log');

const logAction = async ({ userId, action, ip, meta = {} }) => {
  try {
    await Log.create({ user_id: userId, action, ip, meta });
  } catch (error) {
    console.error('logAction error:', error.message);
  }
};

module.exports = logAction;
