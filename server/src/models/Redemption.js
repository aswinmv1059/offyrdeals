const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema(
  {
    coupon_id: { type: String, required: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    offer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
    redeemed_at: { type: Date, required: true },
    ip: { type: String, required: true }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Redemption', redemptionSchema);
