const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image_url: { type: String, trim: true, default: '' },
    actual_price: { type: Number, min: 0, default: 0 },
    discounted_price: { type: Number, min: 0, default: 0 },
    coupon_price: { type: Number, min: 0, default: 0 },
    expiry_date: { type: Date, required: true },
    max_redemptions: { type: Number, required: true, min: 1 },
    category: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Offer', offerSchema);
