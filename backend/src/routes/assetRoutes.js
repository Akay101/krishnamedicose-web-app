const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authMiddleware, checkPermission } = require('../middleware/authMiddleware');
const { upload } = require('../services/r2Service');

router.use(authMiddleware);

router.post('/upload', checkPermission('website'), upload.single('file'), assetController.uploadAsset);
router.get('/', checkPermission('website'), assetController.getAssets);
router.delete('/:id', checkPermission('website'), assetController.deleteAsset);

module.exports = router;
