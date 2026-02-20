const { body } = require('express-validator');
const User = require('../models/User');
const { signToken, hashPassword, comparePassword } = require('../services/authService');
const logAction = require('../utils/logger');

const registerValidators = [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').trim().isLength({ min: 8, max: 20 }),
  body('password').isLength({ min: 8, max: 128 })
];

const loginValidators = [body('email').isEmail().normalizeEmail(), body('password').isString().isLength({ min: 8 })];

const register = async (req, res) => {
  const { name, email, phone, password } = req.body;
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
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 })
];

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
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

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
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

module.exports = {
  registerValidators,
  loginValidators,
  verifyOtpValidators,
  register,
  verifyOtp,
  login,
  me
};
