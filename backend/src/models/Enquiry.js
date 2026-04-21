const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  country: { type: String, required: true },
  email: { type: String, required: true },
  type: { type: String, enum: ['collaborate', 'enquire'], required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['new', 'replied'], default: 'new' },
  replies: [{
    message: String,
    sentAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Enquiry', enquirySchema);
