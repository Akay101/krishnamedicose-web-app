const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  permissions: {
    website: { type: Boolean, default: false },
    leads: { type: Boolean, default: false },
    services: { type: Boolean, default: false },
    bundles: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true },
  // Password-reset OTP is stored as an HMAC digest, never in plain text
  otp: { type: String },
  otpExpires: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  // Bumped on password reset / deactivation to revoke all refresh tokens
  tokenVersion: { type: Number, default: 0 },
  lastLoginAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
