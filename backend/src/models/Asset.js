const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number },
  key: { type: String, required: true }, // R2 Object Key
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Asset', assetSchema);
