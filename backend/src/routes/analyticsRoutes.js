const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.post('/log', analyticsController.logVisit);
router.get('/stats', analyticsController.getDashboardStats);

module.exports = router;
