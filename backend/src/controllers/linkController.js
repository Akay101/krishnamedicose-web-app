const Link = require('../models/Link');

// Get active links for public page
exports.getPublicLinks = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
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
    const { title, description, url, image, category, isActive } = req.body;

    if (!title || !description || !url) {
      return res.status(400).json({ message: 'Title, description, and URL are required' });
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
    const link = await Link.findByIdAndUpdate(req.params.id, req.body, {
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
