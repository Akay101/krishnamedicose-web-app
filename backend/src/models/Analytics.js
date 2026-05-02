const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  visitorId: {
    type: String,
    required: true
  },
  path: String,
  referrer: String,
  userAgent: String,
  device: String,
  os: String,
  browser: String,
  country: String,
  city: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
analyticsSchema.index({ timestamp: -1 });
analyticsSchema.index({ visitorId: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
