const mongoose = require('mongoose');

const BundlePurchaseSchema = new mongoose.Schema({
  // Centralized account that owns this purchase (legacy rows are matched by email)
  serviceUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceUser',
    index: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  mobile: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  bundleType: {
    type: String,
    enum: ['regular', 'student'],
    default: 'regular'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'pending_verification'],
    default: 'pending'
  },
  cashfreeReferenceId: {
    type: String
  },
  paymentSessionId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  paidAt: {
    type: Date
  },
  otp: {
    type: String
  },
  otpExpiresAt: {
    type: Date
  },
  activeSessionId: {
    type: String
  },
  sessionExpiresAt: {
    type: Date
  },
  // HMAC digest of the admin-issued activation code (single use)
  activationCode: {
    type: String
  },
  activationAttempts: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('BundlePurchase', BundlePurchaseSchema);
