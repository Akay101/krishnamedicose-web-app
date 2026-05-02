const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { authMiddleware, checkPermission } = require('../middleware/authMiddleware');

const { upload } = require('../services/r2Service');

// Public Routes
router.get('/', offerController.getOffers);
router.post('/register', upload.any(), offerController.submitLead);

// Admin Routes
router.use(authMiddleware);
router.post('/', checkPermission('website'), offerController.createOffer);
router.put('/:id', checkPermission('website'), offerController.updateOffer);
router.delete('/:id', checkPermission('website'), offerController.deleteOffer);
router.get('/leads', checkPermission('leads'), offerController.getLeads);
router.get('/leads/:offerId', checkPermission('leads'), offerController.getLeads);

module.exports = router;
