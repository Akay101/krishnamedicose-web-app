const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');
const { authMiddleware, checkPermission } = require('../middleware/authMiddleware');

// Public Routes
router.get('/', linkController.getPublicLinks);
router.post('/:id/click', linkController.trackClick);

// Admin Routes (Protected)
router.use(authMiddleware);
router.get('/admin/all', checkPermission('website'), linkController.getAllLinks);
router.post('/', checkPermission('website'), linkController.createLink);
router.put('/:id', checkPermission('website'), linkController.updateLink);
router.delete('/:id', checkPermission('website'), linkController.deleteLink);

module.exports = router;
