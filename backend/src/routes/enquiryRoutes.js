const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const { authMiddleware, checkPermission } = require('../middleware/authMiddleware');

router.post('/', enquiryController.createEnquiry);
router.get('/', authMiddleware, checkPermission('leads'), enquiryController.getEnquiries);
router.post('/:id/reply', authMiddleware, checkPermission('leads'), enquiryController.replyToEnquiry);
router.patch('/:id/followup', authMiddleware, checkPermission('leads'), enquiryController.updateEnquiryFollowUp);

module.exports = router;
