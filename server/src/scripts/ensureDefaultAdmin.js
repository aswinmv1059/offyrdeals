const User = require('../models/User');
const { hashPassword } = require('../services/authService');

const ensureDefaultAdmin = async () => {
  const existing = await User.findOne({ $or: [{ email: 'admin' }, { name: 'admin' }] });
  if (existing) return;

  await User.create({
    name: 'admin',
    email: 'admin',
    phone: '+19999999999',
    password: await hashPassword('admin'),
    role: 'ADMIN',
    isBlocked: false,
    isVendorApproved: false,
    otp: {
      verified: true
    }
  });
};

module.exports = ensureDefaultAdmin;
