const mongoose = require('mongoose');

const BundlePurchaseSchema = new mongoose.Schema({
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
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  cashfreeReferenceId: {
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
  activationCode: {
    type: String
  }
});

module.exports = mongoose.model('BundlePurchase', BundlePurchaseSchema);
