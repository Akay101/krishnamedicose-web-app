const Content = require('../models/Content');
const { sanitizeContentTree } = require('../utils/security');

exports.getContent = async (req, res) => {
  try {
    const content = await Content.findOne({ key: 'landing_page' });
    if (!content) return res.status(404).json({ message: 'Content not found' });
    res.json(content.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateContent = async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({ message: 'Invalid content payload' });
    }
    if (JSON.stringify(data).length > 500000) {
      return res.status(413).json({ message: 'Content payload is too large' });
    }

    const cleanData = sanitizeContentTree(data);
    let content = await Content.findOne({ key: 'landing_page' });
    if (content) {
      content.data = cleanData;
      content.markModified('data');
      content.updatedAt = Date.now();
    } else {
      content = new Content({ key: 'landing_page', data: cleanData });
    }
    await content.save();
    res.json({ message: 'Content updated successfully', data: content.data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
