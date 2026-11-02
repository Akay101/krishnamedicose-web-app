const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const {
  serviceAuthMiddleware,
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
 * AUTHENTICATED USER ENDPOINTS (Registered & Signed-in users + Admins)
 * =========================================================================
 */

// Secure document / catalog PDF / drug license upload with strict sanitary checks
router.post(
  '/upload-document',
  serviceAuthMiddleware,
  upload.single('file'),
  catalogController.uploadDocument
);

// Search / browse approved distributors directory
router.get('/distributors', serviceAuthMiddleware, catalogController.getDistributors);

// Get single distributor details by ID
router.get('/distributors/:id', serviceAuthMiddleware, catalogController.getDistributorById);

// Add distributor (Distributor Self-Registration or Pharmacist Recommendation)
router.post('/distributors', serviceAuthMiddleware, contributionLimiter, catalogController.createDistributor);

// View user's own contributions and approval statuses
router.get('/my-contributions', serviceAuthMiddleware, catalogController.getUserContributions);

// Products endpoints (preserved for backwards-compatibility)
router.get('/products', serviceAuthMiddleware, catalogController.getProducts);
router.get('/products/:id', serviceAuthMiddleware, catalogController.getProductById);
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
