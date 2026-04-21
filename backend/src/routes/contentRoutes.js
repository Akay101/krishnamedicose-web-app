const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { authMiddleware, checkPermission } = require('../middleware/authMiddleware');

router.get('/', contentController.getContent);
router.put('/', authMiddleware, checkPermission('website'), contentController.updateContent);

module.exports = router;
