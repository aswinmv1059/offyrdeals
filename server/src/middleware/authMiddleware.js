const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.id).select('-password');
    if (!user || user.isBlocked) {
      return res.status(401).json({ message: 'Invalid token or blocked user' });
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token validation failed' });
  }
};

module.exports = authMiddleware;
