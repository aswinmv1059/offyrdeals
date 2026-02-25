const { body, param } = require('express-validator');
const Offer = require('../models/Offer');
const Coupon = require('../models/Coupon');
const Redemption = require('../models/Redemption');
const logAction = require('../utils/logger');

const offerValidators = [
  body('title').trim().isLength({ min: 3, max: 120 }),
  body('description').trim().isLength({ min: 10, max: 1000 }),
  body('image_url').optional({ checkFalsy: true }).isURL().withMessage('image_url must be a valid URL'),
  body('actual_price').optional().isFloat({ min: 0 }),
  body('discounted_price').optional().isFloat({ min: 0 }),
  body('coupon_price').optional().isFloat({ min: 0 }),
  body('expiry_date').isISO8601(),
  body('max_redemptions').isInt({ min: 1, max: 100000 }),
  body('category').trim().isLength({ min: 2, max: 80 })
];

const createOffer = async (req, res) => {
  if (!req.user.isVendorApproved) {
    return res.status(403).json({ message: 'Vendor not approved by admin' });
  }

  const offer = await Offer.create({
    vendor_id: req.user._id,
    title: req.body.title,
    description: req.body.description,
    image_url: req.body.image_url || '',
    actual_price: Number(req.body.actual_price || 0),
    discounted_price: Number(req.body.discounted_price || 0),
    coupon_price: Number(req.body.coupon_price || 0),
    expiry_date: req.body.expiry_date,
    max_redemptions: req.body.max_redemptions,
    category: req.body.category
  });

  await logAction({
    userId: req.user._id,
    action: 'OFFER_CREATED',
    ip: req.ip,
    meta: { offer_id: String(offer._id) }
  });

  return res.status(201).json({ offer });
};

const updateOfferValidators = [param('offerId').isMongoId(), ...offerValidators];

const updateOffer = async (req, res) => {
  const offer = await Offer.findOne({ _id: req.params.offerId, vendor_id: req.user._id });
  if (!offer) return res.status(404).json({ message: 'Offer not found' });

  offer.title = req.body.title;
  offer.description = req.body.description;
  offer.image_url = req.body.image_url || '';
  offer.actual_price = Number(req.body.actual_price || 0);
  offer.discounted_price = Number(req.body.discounted_price || 0);
  offer.coupon_price = Number(req.body.coupon_price || 0);
  offer.expiry_date = req.body.expiry_date;
  offer.max_redemptions = req.body.max_redemptions;
  offer.category = req.body.category;
  await offer.save();

  await logAction({
    userId: req.user._id,
    action: 'OFFER_UPDATED',
    ip: req.ip,
    meta: { offer_id: String(offer._id) }
  });

  return res.json({ offer });
};

const getVendorOffers = async (req, res) => {
  const offers = await Offer.find({ vendor_id: req.user._id }).sort({ created_at: -1 });
  return res.json({ offers });
};

const confirmRedemptionValidators = [body('coupon_id').isUUID()];

const confirmRedemption = async (req, res) => {
  const { coupon_id } = req.body;

  const now = new Date();
  await Coupon.updateMany({ status: 'ACTIVE', expires_at: { $lte: now } }, { status: 'EXPIRED' });

  const coupon = await Coupon.findOne({ coupon_id });
  if (!coupon) {
    return res.status(404).json({ message: 'Coupon not found' });
  }

  if (String(coupon.vendor_id) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Coupon does not belong to this vendor' });
  }

  const updated = await Coupon.findOneAndUpdate(
    {
      coupon_id,
      vendor_id: req.user._id,
      status: 'ACTIVE',
      expires_at: { $gt: new Date() }
    },
    {
      $set: {
        status: 'REDEEMED',
        redeemed_at: new Date()
      }
    },
    { new: true }
  );

  if (!updated) {
    return res.status(400).json({ message: 'Coupon already redeemed or expired' });
  }

  await Redemption.create({
    coupon_id: updated.coupon_id,
    user_id: updated.user_id,
    vendor_id: updated.vendor_id,
    offer_id: updated.offer_id,
    redeemed_at: updated.redeemed_at,
    ip: req.ip
  });

  await logAction({
    userId: req.user._id,
    action: 'COUPON_REDEEMED',
    ip: req.ip,
    meta: { coupon_id: updated.coupon_id }
  });

  return res.json({ message: 'Coupon redeemed successfully', coupon: updated });
};

module.exports = {
  offerValidators,
  updateOfferValidators,
  confirmRedemptionValidators,
  createOffer,
  updateOffer,
  getVendorOffers,
  confirmRedemption
};
