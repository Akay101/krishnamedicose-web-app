const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., "landing_page"
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Content', contentSchema);
