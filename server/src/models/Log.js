const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    ip: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

module.exports = mongoose.model('Log', logSchema);
