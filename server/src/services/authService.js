const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const hashPassword = async (password) => bcrypt.hash(password, 12);
const comparePassword = async (password, hashed) => bcrypt.compare(password, hashed);

module.exports = {
  signToken,
  hashPassword,
  comparePassword
};
