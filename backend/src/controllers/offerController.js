const Offer = require('../models/Offer');
const OfferLead = require('../models/OfferLead');
const emailService = require('../services/emailService');
const crypto = require('crypto');

exports.createOffer = async (req, res) => {
  try {
    const offer = new Offer(req.body);
    await offer.save();
    res.status(201).json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getOffers = async (req, res) => {
  try {
    const filters = req.query.activeOnly === 'true' ? { isActive: true } : {};
    const offers = await Offer.find(filters).sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitLead = async (req, res) => {
  try {
    const { offerId, formData } = req.body;
    const offer = await Offer.findById(offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    // Generate unique Registration ID
    const registrationId = `KM-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const lead = new OfferLead({
      offerId,
      registrationId,
      formData
    });
    await lead.save();

    // Trigger Emails
    if (offer.emailConfirmation && formData.email) {
      await emailService.sendOfferConfirmation(formData.email, {
        userName: formData.name || 'User',
        offerTitle: offer.title,
        registrationId,
        details: formData
      });
    }

    // Always notify admin
    await emailService.sendOfferLeadToAdmin({
      offerTitle: offer.title,
      registrationId,
      details: formData
    });

    res.status(201).json({ 
      message: 'Registration successful!', 
      registrationId 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getLeads = async (req, res) => {
  try {
    const query = req.params.offerId ? { offerId: req.params.offerId } : {};
    const leads = await OfferLead.find(query).populate('offerId', 'title').sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
