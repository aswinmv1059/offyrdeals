const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    coupon_id: { type: String, required: true, unique: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    offer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true, index: true },
    status: { type: String, enum: ['ACTIVE', 'REDEEMED', 'EXPIRED'], default: 'ACTIVE', index: true },
    expires_at: { type: Date, required: true, index: true },
    redeemed_at: { type: Date }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Coupon', couponSchema);
