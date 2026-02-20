const User = require('../models/User');
const { hashPassword } = require('../services/authService');

const ensureDefaultAdmin = async () => {
  const hashed = await hashPassword('admin');

  const existingByIdentifier = await User.findOne({
    $or: [{ email: 'admin' }, { name: 'admin' }]
  });

  if (existingByIdentifier) {
    existingByIdentifier.name = 'admin';
    existingByIdentifier.email = 'admin';
    existingByIdentifier.password = hashed;
    existingByIdentifier.role = 'ADMIN';
    existingByIdentifier.isBlocked = false;
    existingByIdentifier.otp = { verified: true, code: null, expiresAt: null };
    await existingByIdentifier.save();
    return;
  }

  const fallbackPhone = `+1999${Date.now().toString().slice(-7)}`;
  await User.create({
    name: 'admin',
    email: 'admin',
    phone: fallbackPhone,
    password: hashed,
    role: 'ADMIN',
    isBlocked: false,
    isVendorApproved: false,
    otp: { verified: true, code: null, expiresAt: null }
  });
};

module.exports = ensureDefaultAdmin;
