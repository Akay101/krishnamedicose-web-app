const mongoose = require('mongoose');

const serviceOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      required: true,
      enum: ['register', 'login']
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '0s' } // MongoDB auto-cleanup via TTL index
    }
  },
  {
    timestamps: false
  }
);

// Compound index for querying active OTP by email and purpose
serviceOtpSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model('ServiceOtp', serviceOtpSchema);
