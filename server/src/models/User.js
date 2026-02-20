const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'VENDOR', 'USER'], default: 'USER' },
    isBlocked: { type: Boolean, default: false },
    isVendorApproved: { type: Boolean, default: false },
    otp: {
      code: { type: String },
      expiresAt: { type: Date },
      verified: { type: Boolean, default: false }
    }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('User', userSchema);
