const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { upload } = require('../services/r2Service');

router.use(authMiddleware);

router.post('/upload', upload.single('file'), assetController.uploadAsset);
router.get('/', assetController.getAssets);
router.delete('/:id', assetController.deleteAsset);

module.exports = router;
