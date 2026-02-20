const { body, query } = require('express-validator');
const Offer = require('../models/Offer');
const Coupon = require('../models/Coupon');
const Redemption = require('../models/Redemption');
const Log = require('../models/Log');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const logAction = require('../utils/logger');

const listOffersValidators = [query('category').optional().trim().isLength({ min: 1, max: 100 })];

const listOffers = async (req, res) => {
  const { category } = req.query;
  const filter = {
    isActive: true,
    expiry_date: { $gt: new Date() }
  };
  if (category) filter.category = category;

  const offers = await Offer.find(filter).populate('vendor_id', 'name email').sort({ created_at: -1 });
  return res.json({ offers });
};

const redeemOfferValidators = [body('offerId').isMongoId()];

const redeemOffer = async (req, res) => {
  const { offerId } = req.body;
  const offer = await Offer.findById(offerId);
  if (!offer || !offer.isActive || new Date(offer.expiry_date) <= new Date()) {
    return res.status(400).json({ message: 'Offer unavailable or expired' });
  }

  const redeemedCount = await Coupon.countDocuments({ offer_id: offerId, status: 'REDEEMED' });
  if (redeemedCount >= offer.max_redemptions) {
    return res.status(400).json({ message: 'Offer redemption limit reached' });
  }

  const couponId = uuidv4();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const coupon = await Coupon.create({
    coupon_id: couponId,
    user_id: req.user._id,
    vendor_id: offer.vendor_id,
    offer_id: offer._id,
    status: 'ACTIVE',
    expires_at: expiresAt
  });

  const qrContent = JSON.stringify({ coupon_id: coupon.coupon_id, expires_at: coupon.expires_at });
  const qrCodeDataUrl = await QRCode.toDataURL(qrContent);

  await logAction({
    userId: req.user._id,
    action: 'COUPON_GENERATED',
    ip: req.ip,
    meta: { coupon_id: coupon.coupon_id, offer_id: String(offer._id) }
  });

  return res.status(201).json({
    coupon: {
      coupon_id: coupon.coupon_id,
      status: coupon.status,
      expires_at: coupon.expires_at,
      qr_code: qrCodeDataUrl
    }
  });
};

const getMyCoupons = async (req, res) => {
  const now = new Date();
  await Coupon.updateMany({ user_id: req.user._id, status: 'ACTIVE', expires_at: { $lte: now } }, { status: 'EXPIRED' });

  const coupons = await Coupon.find({ user_id: req.user._id })
    .populate('offer_id', 'title category')
    .sort({ created_at: -1 });

  return res.json({ coupons });
};

const getLogs = async (req, res) => {
  const logs = await Log.find({ user_id: req.user._id }).sort({ created_at: -1 }).limit(100);
  return res.json({ logs });
};

module.exports = {
  listOffersValidators,
  redeemOfferValidators,
  listOffers,
  redeemOffer,
  getMyCoupons,
  getLogs
};
