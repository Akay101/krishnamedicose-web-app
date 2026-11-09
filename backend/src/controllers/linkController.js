const { escapeRegex } = require("../utils/security");
const Link = require('../models/Link');
const { isSafeUrl, sanitizeUrl, cleanText } = require('../utils/security');

// Normalise admin input: http(s) destinations only, bounded text
const pickLinkFields = (body = {}) => {
  const out = {};
  if (body.title !== undefined) out.title = cleanText(body.title, 150);
  if (body.description !== undefined) out.description = cleanText(body.description, 1000);
  if (body.url !== undefined) out.url = String(body.url).trim();
  if (body.image !== undefined) out.image = sanitizeUrl(body.image);
  if (body.category !== undefined) out.category = cleanText(body.category, 60) || 'General';
  if (body.isActive !== undefined) out.isActive = Boolean(body.isActive);
  return out;
};

const isValidDestination = (url) => isSafeUrl(url, { allowRelative: false }) && /^https?:\/\//i.test(url);

// Get active links for public page
exports.getPublicLinks = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };

    if (typeof category === 'string' && category && category !== 'All') {
      filter.category = category.slice(0, 60);
    }

    if (typeof search === 'string' && search) {
      filter.$or = [
        { title: { $regex: escapeRegex(search), $options: 'i' } },
        { description: { $regex: escapeRegex(search), $options: 'i' } },
        { category: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }

    const links = await Link.find(filter).sort({ createdAt: -1 });
    res.json(links);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all links for admin management
exports.getAllLinks = async (req, res) => {
  try {
    const links = await Link.find().sort({ createdAt: -1 });
    res.json(links);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new link
exports.createLink = async (req, res) => {
  try {
    const { title, description, url, image, category, isActive } = pickLinkFields(req.body);

    if (!title || !description || !url) {
      return res.status(400).json({ message: 'Title, description, and URL are required' });
    }

    if (!isValidDestination(url)) {
      return res.status(400).json({ message: 'Link URL must start with http:// or https://' });
    }

    const link = new Link({
      title,
      description,
      url,
      image: image || '',
      category: category || 'General',
      isActive: isActive !== undefined ? isActive : true,
    });

    await link.save();
    res.status(201).json(link);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update an existing link
exports.updateLink = async (req, res) => {
  try {
    const updates = pickLinkFields(req.body);
    if (updates.url !== undefined && !isValidDestination(updates.url)) {
      return res.status(400).json({ message: 'Link URL must start with http:// or https://' });
    }

    const link = await Link.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    res.json(link);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a link
exports.deleteLink = async (req, res) => {
  try {
    const link = await Link.findByIdAndDelete(req.params.id);
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Track click on a link
exports.trackClick = async (req, res) => {
  try {
    const link = await Link.findByIdAndUpdate(
      req.params.id,
      { $inc: { clickCount: 1 } },
      { new: true }
    );

    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    res.json({ message: 'Click recorded', clickCount: link.clickCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
