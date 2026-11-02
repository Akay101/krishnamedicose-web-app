const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const {
  serviceAuthMiddleware,
  optionalServiceAuth,
  requireAdmin
} = require('../middleware/serviceAuthMiddleware');

const catalogController = require('../controllers/catalogController');
const { upload } = require('../services/catalogUploadService');

// Rate limiting for submissions to prevent spamming
const contributionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60,
  message: { message: 'Submission rate limit reached. Please wait before submitting more items.' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * =========================================================================
 * PUBLIC & USER DIRECTORY ENDPOINTS
 * Browsing approved entries is open to all visitors;
 * Uploads & submissions require signed-in authentication.
 * =========================================================================
 */

// Secure document / catalog PDF / drug license upload with strict sanitary checks
router.post(
  '/upload-document',
  serviceAuthMiddleware,
  upload.single('file'),
  catalogController.uploadDocument
);

// Search / browse approved distributors directory (open to public, enhanced if authenticated)
router.get('/distributors', optionalServiceAuth, catalogController.getDistributors);

// Get single distributor details by ID (approved is public; pending requires owner or admin)
router.get('/distributors/:id', optionalServiceAuth, catalogController.getDistributorById);

// Add distributor (Distributor Self-Registration or Pharmacist Recommendation)
router.post('/distributors', serviceAuthMiddleware, contributionLimiter, catalogController.createDistributor);

// View user's own contributions and approval statuses
router.get('/my-contributions', serviceAuthMiddleware, catalogController.getUserContributions);

// Products endpoints (preserved for backwards-compatibility)
router.get('/products', optionalServiceAuth, catalogController.getProducts);
router.get('/products/:id', optionalServiceAuth, catalogController.getProductById);
router.post('/products', serviceAuthMiddleware, contributionLimiter, catalogController.createProduct);

/**
 * =========================================================================
 * PLATFORM ADMINISTRATOR MANAGEMENT ENDPOINTS
 * =========================================================================
 */

// Catalog dashboard stats
router.get('/admin/stats', requireAdmin, catalogController.getAdminStats);

// Distributors management
router.get('/admin/distributors', requireAdmin, catalogController.getAdminDistributors);
router.post('/admin/distributors', requireAdmin, catalogController.createDistributor);
router.patch('/admin/distributors/:id/status', requireAdmin, catalogController.updateDistributorStatus);
router.put('/admin/distributors/:id', requireAdmin, catalogController.updateDistributor);
router.delete('/admin/distributors/:id', requireAdmin, catalogController.deleteDistributor);

// Products management (admin)
router.get('/admin/products', requireAdmin, catalogController.getAdminProducts);
router.post('/admin/products', requireAdmin, catalogController.createProduct);
router.patch('/admin/products/:id/status', requireAdmin, catalogController.updateProductStatus);
router.put('/admin/products/:id', requireAdmin, catalogController.updateProduct);
router.delete('/admin/products/:id', requireAdmin, catalogController.deleteProduct);

module.exports = router;
