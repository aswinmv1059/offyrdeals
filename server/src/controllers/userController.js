const { body, query } = require('express-validator');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Offer = require('../models/Offer');
const Coupon = require('../models/Coupon');
const Redemption = require('../models/Redemption');
const Log = require('../models/Log');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const logAction = require('../utils/logger');

const listOffersValidators = [query('category').optional().trim().isLength({ min: 1, max: 100 })];

const createPaymentOrderValidators = [body('offerId').isMongoId()];
const verifyPaymentValidators = [
  body('offerId').isMongoId(),
  body('razorpay_order_id').isString().isLength({ min: 3, max: 200 }),
  body('razorpay_payment_id').isString().isLength({ min: 3, max: 200 }),
  body('razorpay_signature').isString().isLength({ min: 8, max: 400 })
];

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

const issueCouponForOffer = async ({ userId, offerId, ip }) => {
  const offer = await Offer.findById(offerId);
  if (!offer || !offer.isActive || new Date(offer.expiry_date) <= new Date()) {
    return { error: { status: 400, message: 'Offer unavailable or expired' } };
  }

  const redeemedCount = await Coupon.countDocuments({ offer_id: offerId, status: 'REDEEMED' });
  if (redeemedCount >= offer.max_redemptions) {
    return { error: { status: 400, message: 'Offer redemption limit reached' } };
  }

  const couponId = uuidv4();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const coupon = await Coupon.create({
    coupon_id: couponId,
    user_id: userId,
    vendor_id: offer.vendor_id,
    offer_id: offer._id,
    status: 'ACTIVE',
    expires_at: expiresAt
  });

  const qrContent = JSON.stringify({ coupon_id: coupon.coupon_id, expires_at: coupon.expires_at });
  const qrCodeDataUrl = await QRCode.toDataURL(qrContent);

  await logAction({
    userId,
    action: 'COUPON_GENERATED',
    ip,
    meta: { coupon_id: coupon.coupon_id, offer_id: String(offer._id) }
  });

  return {
    coupon: {
      coupon_id: coupon.coupon_id,
      status: coupon.status,
      expires_at: coupon.expires_at,
      qr_code: qrCodeDataUrl
    }
  };
};

const redeemOffer = async (req, res) => {
  const { offerId } = req.body;
  const result = await issueCouponForOffer({
    userId: req.user._id,
    offerId,
    ip: req.ip
  });
  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }
  return res.status(201).json({ coupon: result.coupon });
};

const createPaymentOrder = async (req, res) => {
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!razorpayKeyId || !razorpayKeySecret) {
    return res.status(503).json({ message: 'Payment gateway not configured' });
  }

  const offer = await Offer.findById(req.body.offerId);
  if (!offer || !offer.isActive || new Date(offer.expiry_date) <= new Date()) {
    return res.status(400).json({ message: 'Offer unavailable or expired' });
  }

  const baseAmount = Number(offer.coupon_price || 0) > 0 ? Number(offer.coupon_price) : Math.max(10, Number(offer.discounted_price || 99) * 0.1);
  const amountInPaise = Math.round(baseAmount * 100);

  const razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret
  });

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `offyr_${req.user._id}_${Date.now()}`,
    notes: {
      offerId: String(offer._id),
      userId: String(req.user._id)
    }
  });

  await logAction({
    userId: req.user._id,
    action: 'PAYMENT_ORDER_CREATED',
    ip: req.ip,
    meta: { offer_id: String(offer._id), amount: amountInPaise }
  });

  return res.json({
    order,
    amount: amountInPaise,
    key_id: razorpayKeyId,
    offer: { id: offer._id, title: offer.title }
  });
};

const verifyPaymentAndIssueCoupon = async (req, res) => {
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!razorpayKeySecret) {
    return res.status(503).json({ message: 'Payment gateway not configured' });
  }

  const { offerId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac('sha256', razorpayKeySecret).update(payload).digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ message: 'Invalid payment signature' });
  }

  const result = await issueCouponForOffer({
    userId: req.user._id,
    offerId,
    ip: req.ip
  });
  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  await logAction({
    userId: req.user._id,
    action: 'PAYMENT_VERIFIED',
    ip: req.ip,
    meta: { offer_id: String(offerId), razorpay_order_id, razorpay_payment_id }
  });

  return res.status(201).json({
    message: 'Payment verified and coupon issued',
    coupon: result.coupon
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
  createPaymentOrderValidators,
  verifyPaymentValidators,
  redeemOfferValidators,
  listOffers,
  createPaymentOrder,
  verifyPaymentAndIssueCoupon,
  redeemOffer,
  getMyCoupons,
  getLogs
};
