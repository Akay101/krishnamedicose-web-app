const Asset = require('../models/Asset');
const { uploadToR2, deleteFromR2 } = require('../services/r2Service');

exports.uploadAsset = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const r2Result = await uploadToR2(req.file);
    
    const asset = new Asset({
      url: r2Result.url,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      key: r2Result.key
    });

    await asset.save();
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAssets = async (req, res) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    await deleteFromR2(asset.key);
    await Asset.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
