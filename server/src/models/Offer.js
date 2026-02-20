const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    expiry_date: { type: Date, required: true },
    max_redemptions: { type: Number, required: true, min: 1 },
    category: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Offer', offerSchema);
