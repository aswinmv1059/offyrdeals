const { body, param } = require('express-validator');
const { stringify } = require('csv-stringify/sync');
const User = require('../models/User');
const Offer = require('../models/Offer');
const Redemption = require('../models/Redemption');
const Log = require('../models/Log');
const logAction = require('../utils/logger');

const updateRoleValidators = [
  param('userId').isMongoId(),
  body('role').isIn(['ADMIN', 'VENDOR', 'USER'])
];

const setRole = async (req, res) => {
  const { role } = req.body;
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.role = role;
  if (role === 'VENDOR' && !user.isVendorApproved) {
    user.isVendorApproved = true;
  }
  await user.save();

  await logAction({
    userId: req.user._id,
    action: 'ROLE_UPDATED',
    ip: req.ip,
    meta: { target_user_id: String(user._id), role }
  });

  return res.json({ message: 'Role updated', user });
};

const approveVendorValidators = [param('userId').isMongoId()];

const approveVendor = async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.role !== 'VENDOR') return res.status(400).json({ message: 'User is not VENDOR' });

  user.isVendorApproved = true;
  await user.save();

  await logAction({
    userId: req.user._id,
    action: 'VENDOR_APPROVED',
    ip: req.ip,
    meta: { target_user_id: String(user._id) }
  });

  return res.json({ message: 'Vendor approved', user });
};

const blockUserValidators = [param('userId').isMongoId(), body('isBlocked').isBoolean()];

const blockUser = async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isBlocked = req.body.isBlocked;
  await user.save();

  await logAction({
    userId: req.user._id,
    action: 'USER_BLOCK_UPDATED',
    ip: req.ip,
    meta: { target_user_id: String(user._id), isBlocked: user.isBlocked }
  });

  return res.json({ message: 'User block status updated', user });
};

const getUsers = async (req, res) => {
  const users = await User.find().select('-password').sort({ created_at: -1 });
  return res.json({ users });
};

const getOffers = async (req, res) => {
  const offers = await Offer.find().populate('vendor_id', 'name email').sort({ created_at: -1 });
  return res.json({ offers });
};

const getRedemptionLogs = async (req, res) => {
  const logs = await Redemption.find()
    .populate('user_id', 'name email')
    .populate('vendor_id', 'name email')
    .populate('offer_id', 'title category')
    .sort({ redeemed_at: -1 });
  return res.json({ logs });
};

const getSystemLogs = async (req, res) => {
  const logs = await Log.find().sort({ created_at: -1 }).limit(500);
  return res.json({ logs });
};

const exportCsv = async (req, res) => {
  const logs = await Redemption.find().populate('user_id vendor_id offer_id');
  const records = logs.map((entry) => ({
    coupon_id: entry.coupon_id,
    user_email: entry.user_id?.email,
    vendor_email: entry.vendor_id?.email,
    offer_title: entry.offer_id?.title,
    redeemed_at: entry.redeemed_at,
    ip: entry.ip
  }));

  const csv = stringify(records, { header: true });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="redemptions.csv"');

  await logAction({ userId: req.user._id, action: 'CSV_EXPORTED', ip: req.ip, meta: { count: records.length } });

  return res.send(csv);
};

module.exports = {
  updateRoleValidators,
  approveVendorValidators,
  blockUserValidators,
  setRole,
  approveVendor,
  blockUser,
  getUsers,
  getOffers,
  getRedemptionLogs,
  getSystemLogs,
  exportCsv
};
