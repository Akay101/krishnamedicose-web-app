const mongoose = require('mongoose');

const offerLeadSchema = new mongoose.Schema({
  offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
  registrationId: { type: String, unique: true, required: true },
  formData: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OfferLead', offerLeadSchema);
