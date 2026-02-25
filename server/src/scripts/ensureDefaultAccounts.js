const User = require('../models/User');
const { hashPassword } = require('../services/authService');

const upsertAccount = async ({ identifier, password, role, phonePrefix }) => {
  const hashed = await hashPassword(password);
  let user = await User.findOne({ $or: [{ email: identifier }, { name: identifier }] });

  if (user) {
    user.name = identifier;
    user.email = identifier;
    user.password = hashed;
    user.role = role;
    user.isBlocked = false;
    user.otp = { verified: true, code: null, expiresAt: null };
    await user.save();
    return;
  }

  const fallbackPhone = `${phonePrefix}${Date.now().toString().slice(-7)}`;
  await User.create({
    name: identifier,
    email: identifier,
    phone: fallbackPhone,
    password: hashed,
    role,
    isBlocked: false,
    isVendorApproved: role === 'VENDOR',
    otp: { verified: true, code: null, expiresAt: null }
  });
};

const ensureDefaultAccounts = async () => {
  await upsertAccount({
    identifier: 'admin',
    password: 'admin',
    role: 'ADMIN',
    phonePrefix: '+1998'
  });
  await upsertAccount({
    identifier: 'user',
    password: 'user',
    role: 'USER',
    phonePrefix: '+9197'
  });
  await upsertAccount({
    identifier: 'vendor',
    password: 'vendor',
    role: 'VENDOR',
    phonePrefix: '+9196'
  });
};

module.exports = ensureDefaultAccounts;
