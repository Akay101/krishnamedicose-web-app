const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const {
  serviceAuthMiddleware,
  requireAdmin
} = require('../middleware/serviceAuthMiddleware');

const catalogController = require('../controllers/catalogController');

// Rate limiting for submissions to prevent spamming
const contributionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 40,
  message: { message: 'Submission rate limit reached. Please wait before submitting more items.' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * =========================================================================
 * AUTHENTICATED USER ENDPOINTS (Registered & Signed-in users + Admins)
 * =========================================================================
 */

// Search / browse approved product catalogs
router.get('/products', serviceAuthMiddleware, catalogController.getProducts);

// Get single product details by ID
router.get('/products/:id', serviceAuthMiddleware, catalogController.getProductById);

// Contribute / Add product catalog entry (User -> pending approval; Admin -> approved)
router.post('/products', serviceAuthMiddleware, contributionLimiter, catalogController.createProduct);

// Search / browse approved distributors directory
router.get('/distributors', serviceAuthMiddleware, catalogController.getDistributors);

// Get single distributor details by ID
router.get('/distributors/:id', serviceAuthMiddleware, catalogController.getDistributorById);

// Add distributor (User -> pending approval; Admin -> approved)
router.post('/distributors', serviceAuthMiddleware, contributionLimiter, catalogController.createDistributor);

// View user's own contributions and approval statuses
router.get('/my-contributions', serviceAuthMiddleware, catalogController.getUserContributions);

/**
 * =========================================================================
 * PLATFORM ADMINISTRATOR MANAGEMENT ENDPOINTS
 * =========================================================================
 */

// Catalog dashboard stats
router.get('/admin/stats', requireAdmin, catalogController.getAdminStats);

// Products management
router.get('/admin/products', requireAdmin, catalogController.getAdminProducts);
router.post('/admin/products', requireAdmin, catalogController.createProduct);
router.patch('/admin/products/:id/status', requireAdmin, catalogController.updateProductStatus);
router.put('/admin/products/:id', requireAdmin, catalogController.updateProduct);
router.delete('/admin/products/:id', requireAdmin, catalogController.deleteProduct);

// Distributors management
router.get('/admin/distributors', requireAdmin, catalogController.getAdminDistributors);
router.post('/admin/distributors', requireAdmin, catalogController.createDistributor);
router.patch('/admin/distributors/:id/status', requireAdmin, catalogController.updateDistributorStatus);
router.put('/admin/distributors/:id', requireAdmin, catalogController.updateDistributor);
router.delete('/admin/distributors/:id', requireAdmin, catalogController.deleteDistributor);

module.exports = router;
