const { body, param } = require('express-validator');
const { stringify } = require('csv-stringify/sync');
const User = require('../models/User');
const Offer = require('../models/Offer');
const Coupon = require('../models/Coupon');
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
  if (user.email === 'admin' && role !== 'ADMIN') {
    return res.status(400).json({ message: 'Default admin account role cannot be changed' });
  }
  if (user.role === 'ADMIN' && req.user._id.toString() !== user._id.toString()) {
    return res.status(400).json({ message: 'Cannot change another admin role' });
  }

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
  if (user.email === 'admin' || req.user._id.toString() === user._id.toString()) {
    return res.status(400).json({ message: 'Cannot block default admin/self' });
  }
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

const deleteUserValidators = [param('userId').isMongoId()];

const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.email === 'admin' || req.user._id.toString() === user._id.toString()) {
    return res.status(400).json({ message: 'Cannot delete default admin/self' });
  }

  await User.deleteOne({ _id: user._id });

  await logAction({
    userId: req.user._id,
    action: 'USER_DELETED',
    ip: req.ip,
    meta: { target_user_id: String(user._id), target_email: user.email }
  });

  return res.json({ message: 'User deleted successfully' });
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

const getVendorSales = async (_req, res) => {
  const [vendors, offers, redeemedCoupons] = await Promise.all([
    User.find({ role: 'VENDOR' }).select('name email'),
    Offer.find().select('vendor_id title discounted_price coupon_price'),
    Coupon.find({ status: 'REDEEMED' }).select('offer_id vendor_id')
  ]);

  const redeemedByOffer = redeemedCoupons.reduce((acc, item) => {
    const key = String(item.offer_id);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const offersByVendor = offers.reduce((acc, offer) => {
    const vendorId = String(offer.vendor_id);
    if (!acc[vendorId]) acc[vendorId] = [];
    const sold = redeemedByOffer[String(offer._id)] || 0;
    const unitPrice = Number(offer.discounted_price || 0) + Number(offer.coupon_price || 0);
    const revenue = sold * unitPrice;
    acc[vendorId].push({
      offerId: offer._id,
      title: offer.title,
      sold,
      revenue
    });
    return acc;
  }, {});

  const DEFAULT_COMMISSION_RATE = 0.15;
  const report = vendors.map((vendor) => {
    const products = offersByVendor[String(vendor._id)] || [];
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
    const commission = Math.round(totalRevenue * DEFAULT_COMMISSION_RATE);
    const profit = totalRevenue - commission;
    const totalSold = products.reduce((sum, p) => sum + p.sold, 0);
    return {
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email
      },
      totalRevenue,
      totalSold,
      commission,
      profit,
      products
    };
  });

  return res.json({ vendors: report });
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
  deleteUserValidators,
  setRole,
  approveVendor,
  blockUser,
  deleteUser,
  getUsers,
  getOffers,
  getRedemptionLogs,
  getSystemLogs,
  getVendorSales,
  exportCsv
};
