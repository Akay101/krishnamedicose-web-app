const Content = require('../models/Content');

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
    let content = await Content.findOne({ key: 'landing_page' });
    if (content) {
      content.data = data;
      content.updatedAt = Date.now();
    } else {
      content = new Content({ key: 'landing_page', data });
    }
    await content.save();
    res.json({ message: 'Content updated successfully', data: content.data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
