const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Link title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Link description is required'],
    trim: true,
  },
  url: {
    type: String,
    required: [true, 'Link destination URL is required'],
    trim: true,
  },
  image: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: 'General',
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  clickCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Link', linkSchema);
