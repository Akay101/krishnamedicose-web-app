const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String }, // R2 URL
  isActive: { type: Boolean, default: true },
  formEnabled: { type: Boolean, default: false },
  emailConfirmation: { type: Boolean, default: false },
  formFields: [{
    name: String, // index for JSON object (e.g., "name")
    label: String, // UI label (e.g., "Full Name")
    type: { type: String, enum: ['text', 'number', 'email', 'textarea', 'file'], default: 'text' },
    required: { type: Boolean, default: true },
    isUnique: { type: Boolean, default: false },
    placeholder: String,
    validation: String // regex pattern if any
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Offer', offerSchema);
