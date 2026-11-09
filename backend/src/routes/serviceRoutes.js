const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const {
  serviceAuthMiddleware,
  optionalServiceAuth,
  requireRole,
  requireAdmin
} = require('../middleware/serviceAuthMiddleware');

const { upload } = require('../services/serviceUploadService');

// Controllers
const authController = require('../controllers/serviceAuthController');
const jobController = require('../controllers/serviceJobController');
const collabController = require('../controllers/serviceCollabController');
const talentController = require('../controllers/serviceTalentController');
const adminController = require('../controllers/serviceAdminController');
const locationController = require('../controllers/serviceLocationController');
const doctorRequestController = require('../controllers/serviceDoctorRequestController');

// Rate limiting configurations (Industry standard protection against spam & brute-force)
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many verification code requests. Please wait 15 minutes before requesting again.' },
  standardHeaders: true,
  legacyHeaders: false
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many verification attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

const serviceAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many sign-in attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

const postCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: 'Posting rate limit reached. Please wait an hour before publishing more listings.' },
  standardHeaders: true,
  legacyHeaders: false
});

const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { message: 'Submission limit reached. Please wait before submitting more applications or inquiries.' },
  standardHeaders: true,
  legacyHeaders: false
});

/* ===================================================
   AUTHENTICATION & PROFILE ENDPOINTS
=================================================== */

// Step 1: Send OTP for new account registration
router.post('/auth/send-register-otp', otpSendLimiter, authController.sendRegisterOtp);

// Step 2: Register with verified OTP & optional license document upload
router.post(
  '/auth/register',
  otpVerifyLimiter,
  upload.single('licenseFile'),
  authController.register
);

// Sign in Step 1: Check credentials & send 6-digit OTP to user email
router.post('/auth/login', serviceAuthLimiter, authController.login);

// Sign in Step 2: Verify 6-digit OTP & issue 24-hour JWT token
router.post('/auth/verify-login-otp', otpVerifyLimiter, authController.verifyLoginOtp);

// Resend OTP for registration, sign in, or forgot password (with 60s cooldown)
router.post('/auth/resend-otp', otpSendLimiter, authController.resendOtp);

// Forgot Password Step 1: Request 6-digit OTP to registered email
router.post('/auth/forgot-password', otpSendLimiter, authController.forgotPassword);

// Forgot Password Step 2: Verify 6-digit OTP & reset password
router.post('/auth/reset-password', otpVerifyLimiter, authController.resetPassword);

// Get authenticated service user profile
router.get('/auth/me', serviceAuthMiddleware, authController.getMe);

// Update profile details & location
router.put('/auth/profile', serviceAuthMiddleware, authController.updateProfile);

// Toggle Open-to-Work or Open-to-Collaborate
router.patch('/auth/toggle-availability', serviceAuthMiddleware, authController.toggleAvailability);

// Upload standalone document (license image, certificate, etc.)
router.post('/upload', serviceAuthMiddleware, upload.single('document'), authController.uploadFile);

// User in-app notifications
router.get('/notifications', serviceAuthMiddleware, authController.getNotifications);
router.patch('/notifications/:id/read', serviceAuthMiddleware, authController.markNotificationRead);
router.patch('/notifications/read-all', serviceAuthMiddleware, authController.markAllNotificationsRead);

// Multi-source location search & reverse geocoding
router.get('/location/autocomplete', locationController.autocomplete);
router.get('/location/reverse', locationController.reverseGeocode);

/* ===================================================
   JOB POSTINGS & APPLICANTS (PHARMACY OWNER & PHARMACISTS)
=================================================== */

// Create a job post (Pharmacy Owner)
router.post(
  '/jobs',
  serviceAuthMiddleware,
  requireRole(['pharmacy_owner', 'general_user']),
  postCreationLimiter,
  jobController.createJobPost
);

// Get my posted jobs (Pharmacy Owner)
router.get(
  '/jobs/my-jobs',
  serviceAuthMiddleware,
  requireRole(['pharmacy_owner', 'general_user']),
  jobController.getMyJobs
);

// NOTE: static paths must be registered before '/jobs/:id'.
// Get submitted applications (Pharmacist)
router.get('/jobs/my-applications', serviceAuthMiddleware, jobController.getMyApplications);

// Job feed (Pharmacist job seekers, with distance calculations & filters)
router.get('/jobs/feed', optionalServiceAuth, jobController.getJobFeed);

// Get job post by ID
router.get('/jobs/:id', optionalServiceAuth, jobController.getJobById);

// Update job post
router.put('/jobs/:id', serviceAuthMiddleware, jobController.updateJobPost);

// Delete job post
router.delete('/jobs/:id', serviceAuthMiddleware, jobController.deleteJobPost);

// Apply for a job (Pharmacist)
router.post(
  '/jobs/:id/apply',
  serviceAuthMiddleware,
  requireRole(['job_seeker_pharmacist', 'pharmacy_owner']),
  applicationLimiter,
  jobController.applyForJob
);

// Get applicants for a job (Owner)
router.get('/jobs/:id/applications', serviceAuthMiddleware, jobController.getJobApplications);

// Update application status (Owner shortlisting/reviewing)
router.patch(
  '/jobs/applications/:appId/status',
  serviceAuthMiddleware,
  jobController.updateApplicationStatus
);


/* ===================================================
   DOCTOR COLLABORATION (PHARMACY OWNER & DOCTORS)
=================================================== */

// Create doctor collaboration post (Pharmacy Owner)
router.post(
  '/collab-posts',
  serviceAuthMiddleware,
  requireRole(['pharmacy_owner', 'general_user']),
  postCreationLimiter,
  collabController.createCollabPost
);

// Get my collaboration listings (Pharmacy Owner)
router.get(
  '/collab-posts/my-posts',
  serviceAuthMiddleware,
  requireRole(['pharmacy_owner', 'general_user']),
  collabController.getMyCollabPosts
);

// NOTE: static paths must be registered before '/collab-posts/:id'.
// View sent inquiries (Doctor)
router.get('/collab-posts/my-inquiries', serviceAuthMiddleware, collabController.getMyInquiries);

// Doctor collaboration feed (Doctors looking for clinic/chamber)
router.get('/collab-posts/feed', optionalServiceAuth, collabController.getCollabFeed);

// Get collaboration listing by ID
router.get('/collab-posts/:id', optionalServiceAuth, collabController.getCollabPostById);

// Update collaboration listing
router.put('/collab-posts/:id', serviceAuthMiddleware, collabController.updateCollabPost);

// Delete collaboration listing
router.delete('/collab-posts/:id', serviceAuthMiddleware, collabController.deleteCollabPost);

// Express interest / send proposal (Doctor)
router.post(
  '/collab-posts/:id/inquire',
  serviceAuthMiddleware,
  requireRole(['doctor']),
  applicationLimiter,
  collabController.inquireCollabPost
);

// View inquiries received (Owner)
router.get('/collab-posts/:id/inquiries', serviceAuthMiddleware, collabController.getCollabInquiries);

// Update inquiry status (Owner)
router.patch(
  '/collab-posts/inquiries/:inqId/status',
  serviceAuthMiddleware,
  collabController.updateInquiryStatus
);


/* ===================================================
   DOCTORS LOOKING FOR A CHAMBER (DOCTOR -> PHARMACY)
=================================================== */

// Static paths first (before '/doctor-requests/:id')
router.get('/doctor-requests/feed', optionalServiceAuth, doctorRequestController.getFeed);
router.get('/doctor-requests/my-requests', serviceAuthMiddleware, requireRole(['doctor']), doctorRequestController.getMyRequests);
router.get('/doctor-requests/my-offers', serviceAuthMiddleware, doctorRequestController.getMyOffers);
router.patch('/doctor-requests/responses/:responseId/status', serviceAuthMiddleware, requireRole(['doctor']), doctorRequestController.updateResponseStatus);

router.post('/doctor-requests', serviceAuthMiddleware, requireRole(['doctor']), postCreationLimiter, doctorRequestController.createRequest);
router.put('/doctor-requests/:id', serviceAuthMiddleware, requireRole(['doctor']), doctorRequestController.updateRequest);
router.delete('/doctor-requests/:id', serviceAuthMiddleware, requireRole(['doctor']), doctorRequestController.deleteRequest);
router.get('/doctor-requests/:id/responses', serviceAuthMiddleware, requireRole(['doctor']), doctorRequestController.getResponses);
router.post(
  '/doctor-requests/:id/respond',
  serviceAuthMiddleware,
  requireRole(['pharmacy_owner', 'general_user']),
  applicationLimiter,
  doctorRequestController.respondToRequest
);

/* ===================================================
   TALENT DISCOVERY (PHARMACISTS & DOCTORS DIRECTORY)
=================================================== */

// Browse open-to-work pharmacists nearby
router.get('/talent/pharmacists', optionalServiceAuth, talentController.getOpenPharmacists);

// Browse open-to-collaborate doctors nearby
router.get('/talent/doctors', optionalServiceAuth, talentController.getOpenDoctors);

/* ===================================================
   ADMIN MANAGEMENT ENDPOINTS
=================================================== */

// Overall service platform analytics
router.get('/admin/stats', requireAdmin, adminController.getAdminStats);

// All service users with filters and search
router.get('/admin/users', requireAdmin, adminController.getAdminUsers);

// Toggle block user account
router.patch('/admin/users/:id/toggle-block', requireAdmin, adminController.toggleBlockUser);

// Toggle license verification
router.patch('/admin/users/:id/toggle-verify', requireAdmin, adminController.toggleVerifyUser);

// Update user details (Admin)
router.put('/admin/users/:id', requireAdmin, adminController.updateUser);

// Delete user account permanently
router.delete('/admin/users/:id', requireAdmin, adminController.deleteUser);

// All jobs across platform
router.get('/admin/jobs', requireAdmin, adminController.getAdminJobs);

// Toggle job status (Admin)
router.patch('/admin/jobs/:id/status', requireAdmin, adminController.toggleJobStatus);

// Approve / reject a job vacancy (verification)
router.patch('/admin/jobs/:id/moderate', requireAdmin, adminController.moderateJob);

// Edit any job post (admin edits never send it back for review)
router.put('/admin/jobs/:id', requireAdmin, jobController.updateJobPost);

// Delete any job post
router.delete('/admin/jobs/:id', requireAdmin, adminController.deleteAdminJob);

// All doctor collaboration posts
router.get('/admin/collab-posts', requireAdmin, adminController.getAdminCollabPosts);

// Toggle collaboration status (Admin)
router.patch('/admin/collab-posts/:id/status', requireAdmin, adminController.toggleCollabStatus);

// Doctor chamber requirements (admin)
router.get('/admin/doctor-requests', requireAdmin, doctorRequestController.getAdminRequests);
router.patch('/admin/doctor-requests/:id/moderate', requireAdmin, adminController.moderateDoctorRequest);
router.put('/admin/doctor-requests/:id', requireAdmin, doctorRequestController.updateRequest);
router.delete('/admin/doctor-requests/:id', requireAdmin, adminController.deleteAdminDoctorRequest);

// Approve / reject a doctor chamber listing (verification)
router.patch('/admin/collab-posts/:id/moderate', requireAdmin, adminController.moderateCollab);

// Edit any collaboration post
router.put('/admin/collab-posts/:id', requireAdmin, collabController.updateCollabPost);

// Delete any collaboration post
router.delete('/admin/collab-posts/:id', requireAdmin, adminController.deleteAdminCollabPost);

module.exports = router;
