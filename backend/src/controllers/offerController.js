const Offer = require("../models/Offer");
const OfferLead = require("../models/OfferLead");
const emailService = require("../services/emailService");
const crypto = require("crypto");
const { cleanText, sanitizeUrl } = require("../utils/security");

// Admin-managed offers: only whitelisted, typed fields can be written
const OFFER_FIELDS = ["title", "description", "image", "isActive", "formEnabled", "formFields", "emailConfirmation"];
const pickOfferFields = (body = {}) =>
  OFFER_FIELDS.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = key === "image" ? sanitizeUrl(body[key]) : body[key];
    return acc;
  }, {});

exports.createOffer = async (req, res) => {
  try {
    const offer = new Offer(pickOfferFields(req.body));
    await offer.save();
    res.status(201).json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getOffers = async (req, res) => {
  try {
    const filters = req.query.activeOnly === "true" ? { isActive: true } : {};
    const offers = await Offer.find(filters).sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, pickOfferFields(req.body), {
      new: true,
      runValidators: true,
    });
    res.json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ message: "Offer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { uploadToR2 } = require("../services/r2Service");

exports.submitLead = async (req, res) => {
  try {
    const { offerId, ...rawFormData } = req.body;
    if (typeof offerId !== "string") return res.status(400).json({ message: "Offer not found" });
    const offer = await Offer.findById(offerId);
    if (!offer || offer.isActive === false) return res.status(404).json({ message: "Offer not found" });

    // Keep only the fields this offer actually declares (plus common contact fields)
    const declared = new Map((offer.formFields || []).map((f) => [f.name, f]));
    const formData = {};
    for (const [key, value] of Object.entries(rawFormData)) {
      if (declared.has(key) || ["name", "email", "mobile", "phone"].includes(key)) {
        formData[key] = cleanText(Array.isArray(value) ? value.join(", ") : value, 2000);
      }
    }

    // Handle File Uploads (only for declared file fields)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const field = declared.get(file.fieldname);
        if (!field || !["file", "image", "document"].includes(field.type)) continue;
        const r2Result = await uploadToR2(file);
        formData[file.fieldname] = r2Result.url;
      }
    }

    // Generate unique Registration ID
    const registrationId = `KM-${crypto.randomBytes(3).toString("hex").toUpperCase()}-${Date.now().toString().slice(-4)}`;

    // Check for unique fields
    for (const field of offer.formFields) {
      if (field.isUnique) {
        const value = formData[field.name];
        if (value && typeof value === "string") {
          const existingLead = await OfferLead.findOne({
            offerId: offerId,
            [`formData.${field.name}`]: value,
          });
          if (existingLead) {
            return res.status(400).json({
              message: `This ${field.label} is already registered for this offer.`,
            });
          }
        }
      }
    }

    const lead = new OfferLead({
      offerId,
      registrationId,
      formData,
    });
    await lead.save();

    // Trigger Emails
    if (offer.emailConfirmation && formData.email) {
      await emailService.sendOfferConfirmation(formData.email, {
        userName: formData.name || "User",
        offerTitle: offer.title,
        registrationId,
        details: formData,
      });
    }

    // Always notify admin
    await emailService.sendOfferLeadToAdmin({
      offerTitle: offer.title,
      registrationId,
      details: formData,
    });

    res.status(201).json({
      message: "Registration successful!",
      registrationId,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getLeads = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const offerId = req.params.offerId;

    const query = {};
    if (offerId) query.offerId = offerId;
    if (status === 'pending' || status === 'completed') query.followUpStatus = status;

    const [leads, total, pendingCount, completedCount] = await Promise.all([
      OfferLead.find(query)
        .populate("offerId", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      OfferLead.countDocuments(query),
      OfferLead.countDocuments({ ...query, followUpStatus: 'pending' }),
      OfferLead.countDocuments({ ...query, followUpStatus: 'completed' })
    ]);

    res.json({
      data: leads,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      pendingCount,
      completedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateLeadFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { followUpStatus, followUpNotes } = req.body;

    const lead = await OfferLead.findByIdAndUpdate(
      id,
      {
        followUpStatus: followUpStatus === 'completed' ? 'completed' : 'pending',
        followUpNotes: cleanText(followUpNotes, 2000)
      },
      { new: true }
    ).populate("offerId", "title");
    
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};