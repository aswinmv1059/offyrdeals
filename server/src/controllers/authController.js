const { body } = require('express-validator');
const User = require('../models/User');
const { signToken, hashPassword, comparePassword } = require('../services/authService');
const logAction = require('../utils/logger');
const IN_PHONE_REGEX = /^\+91[6-9]\d{9}$/;

const normalizeIndianPhone = (value = '') => {
  const raw = String(value).trim();
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return raw;
};

const findUserForOtpFlow = async ({ phone, email, identifier }) => {
  const target = String(phone || email || identifier || '').trim();
  if (!target) return null;
  const normalizedPhone = normalizeIndianPhone(target);
  const or = [{ email: target }, { name: target }, { phone: target }];
  if (normalizedPhone !== target) {
    or.push({ phone: normalizedPhone });
  }
  return User.findOne({ $or: or });
};

const registerValidators = [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').matches(IN_PHONE_REGEX).withMessage('Phone must be Indian format: +91XXXXXXXXXX'),
  body('password').isLength({ min: 6, max: 128 }).withMessage('Password must be at least 6 characters')
];

const loginValidators = [
  body('identifier').isString().isLength({ min: 1, max: 120 }),
  body('password').isString().isLength({ min: 1, max: 128 })
];

const register = async (req, res) => {
  const { name, email, password } = req.body;
  const phone = normalizeIndianPhone(req.body.phone);
  const [existingEmail, existingPhone] = await Promise.all([
    User.findOne({ email }),
    User.findOne({ phone })
  ]);

  if (existingEmail || existingPhone) {
    return res.status(409).json({ message: 'Email or phone already exists' });
  }

  const usersCount = await User.countDocuments();
  const role = usersCount === 0 ? 'ADMIN' : 'USER';
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));

  const user = await User.create({
    name,
    email,
    phone,
    password: await hashPassword(password),
    role,
    isVendorApproved: role === 'VENDOR',
    otp: {
      code: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      verified: false
    }
  });

  await logAction({
    userId: user._id,
    action: 'REGISTER',
    ip: req.ip,
    meta: { roleAssigned: role }
  });

  return res.status(201).json({
    message: 'Registered successfully',
    otp_simulation: otpCode,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at
    }
  });
};

const verifyOtpValidators = [
  body().custom((_, { req }) => {
    if (req.body.phone || req.body.email || req.body.identifier) {
      return true;
    }
    throw new Error('phone, email or identifier is required');
  }),
  body('otp').isLength({ min: 6, max: 6 })
];

const resendOtpValidators = [
  body().custom((_, { req }) => {
    if (req.body.phone || req.body.email || req.body.identifier) {
      return true;
    }
    throw new Error('phone, email or identifier is required');
  })
];

const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  const user = await findUserForOtpFlow(req.body);
  if (!user || !user.otp || !user.otp.code) {
    return res.status(404).json({ message: 'User or OTP not found' });
  }
  if (new Date(user.otp.expiresAt) < new Date()) {
    return res.status(400).json({ message: 'OTP expired' });
  }
  if (user.otp.code !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  user.otp.verified = true;
  user.otp.code = null;
  await user.save();

  await logAction({ userId: user._id, action: 'OTP_VERIFIED', ip: req.ip });

  return res.json({ message: 'OTP verified' });
};

const resendOtp = async (req, res) => {
  const user = await findUserForOtpFlow(req.body);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  user.otp = {
    code: otpCode,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    verified: false
  };
  await user.save();

  await logAction({ userId: user._id, action: 'OTP_RESENT', ip: req.ip });

  return res.json({ message: 'OTP regenerated', otp_simulation: otpCode });
};

const login = async (req, res) => {
  const { identifier, password } = req.body;
  const normalizedIdentifier = normalizeIndianPhone(identifier);
  const user = await User.findOne({
    $or: [
      { email: identifier },
      { name: identifier },
      { phone: identifier },
      { phone: normalizedIdentifier }
    ]
  });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  if (user.isBlocked) {
    return res.status(403).json({ message: 'Account blocked by admin' });
  }
  if (user?.otp && user.otp.verified === false) {
    return res.status(403).json({ message: 'OTP not verified. Please verify OTP before login.' });
  }
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken(user);

  await logAction({ userId: user._id, action: 'LOGIN', ip: req.ip });

  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at,
      isVendorApproved: user.isVendorApproved
    }
  });
};

const me = async (req, res) => {
  return res.json({ user: req.user });
};

const adminBootstrapLogin = async (req, res) => {
  const { identifier, password } = req.body || {};
  if (identifier !== 'admin' || password !== 'admin') {
    return res.status(401).json({ message: 'Invalid admin bootstrap credentials' });
  }

  const hashed = await hashPassword('admin');
  let user = await User.findOne({ $or: [{ email: 'admin' }, { name: 'admin' }] });

  if (user) {
    user.name = 'admin';
    user.email = 'admin';
    user.password = hashed;
    user.role = 'ADMIN';
    user.isBlocked = false;
    user.otp = { verified: true, code: null, expiresAt: null };
    await user.save();
  } else {
    const fallbackPhone = `+1998${Date.now().toString().slice(-7)}`;
    user = await User.create({
      name: 'admin',
      email: 'admin',
      phone: fallbackPhone,
      password: hashed,
      role: 'ADMIN',
      isBlocked: false,
      isVendorApproved: false,
      otp: { verified: true, code: null, expiresAt: null }
    });
  }

  const token = signToken(user);
  await logAction({ userId: user._id, action: 'ADMIN_BOOTSTRAP_LOGIN', ip: req.ip });

  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at,
      isVendorApproved: user.isVendorApproved
    }
  });
};

const userBootstrapLogin = async (req, res) => {
  const { identifier, password } = req.body || {};
  if (identifier !== 'user' || password !== 'user') {
    return res.status(401).json({ message: 'Invalid user bootstrap credentials' });
  }

  const hashed = await hashPassword('user');
  let user = await User.findOne({ $or: [{ email: 'user' }, { name: 'user' }] });

  if (user) {
    user.name = 'user';
    user.email = 'user';
    user.password = hashed;
    user.role = 'USER';
    user.isBlocked = false;
    user.otp = { verified: true, code: null, expiresAt: null };
    await user.save();
  } else {
    const fallbackPhone = `+1997${Date.now().toString().slice(-7)}`;
    user = await User.create({
      name: 'user',
      email: 'user',
      phone: fallbackPhone,
      password: hashed,
      role: 'USER',
      isBlocked: false,
      isVendorApproved: false,
      otp: { verified: true, code: null, expiresAt: null }
    });
  }

  const token = signToken(user);
  await logAction({ userId: user._id, action: 'USER_BOOTSTRAP_LOGIN', ip: req.ip });

  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at,
      isVendorApproved: user.isVendorApproved
    }
  });
};

const vendorBootstrapLogin = async (req, res) => {
  const { identifier, password } = req.body || {};
  if (identifier !== 'vendor' || password !== 'vendor') {
    return res.status(401).json({ message: 'Invalid vendor bootstrap credentials' });
  }

  const hashed = await hashPassword('vendor');
  let user = await User.findOne({ $or: [{ email: 'vendor' }, { name: 'vendor' }] });

  if (user) {
    user.name = 'vendor';
    user.email = 'vendor';
    user.password = hashed;
    user.role = 'VENDOR';
    user.isBlocked = false;
    user.isVendorApproved = true;
    user.otp = { verified: true, code: null, expiresAt: null };
    await user.save();
  } else {
    const fallbackPhone = `+9199${Date.now().toString().slice(-8)}`;
    user = await User.create({
      name: 'vendor',
      email: 'vendor',
      phone: fallbackPhone,
      password: hashed,
      role: 'VENDOR',
      isBlocked: false,
      isVendorApproved: true,
      otp: { verified: true, code: null, expiresAt: null }
    });
  }

  const token = signToken(user);
  await logAction({ userId: user._id, action: 'VENDOR_BOOTSTRAP_LOGIN', ip: req.ip });

  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at,
      isVendorApproved: user.isVendorApproved
    }
  });
};

module.exports = {
  registerValidators,
  loginValidators,
  verifyOtpValidators,
  resendOtpValidators,
  register,
  verifyOtp,
  resendOtp,
  login,
  me,
  adminBootstrapLogin,
  userBootstrapLogin,
  vendorBootstrapLogin
};
