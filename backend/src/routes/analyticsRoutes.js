const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware, checkPermission } = require('../middleware/authMiddleware');

router.post('/log', analyticsController.logVisit);
router.get('/stats', authMiddleware, checkPermission('website'), analyticsController.getDashboardStats);

module.exports = router;
