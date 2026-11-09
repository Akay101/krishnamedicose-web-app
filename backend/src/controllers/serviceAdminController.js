const { escapeRegex } = require("../utils/security");
const ServiceUser = require('../models/ServiceUser');
const JobPost = require('../models/JobPost');
const DoctorCollaborationPost = require('../models/DoctorCollaborationPost');
const JobApplication = require('../models/JobApplication');
const DoctorCollaborationInquiry = require('../models/DoctorCollaborationInquiry');
const { cleanText } = require('../utils/security');
const DoctorChamberRequest = require('../models/DoctorChamberRequest');
const DoctorRequestResponse = require('../models/DoctorRequestResponse');
const {
  sendListingReviewedEmail,
  notifyPharmacistsOfNewJob,
  notifyDoctorsOfNewCollab,
  notifyPharmaciesOfDoctorRequest,
  sendProfileVerificationEmail
} = require('../services/serviceNotificationService');
const { collabHeading } = require('./serviceCollabController');
const { requestHeading } = require('./serviceDoctorRequestController');

const LISTING_KINDS = {
  job: { heading: (l) => l.title, ownerField: 'ownerId', notify: notifyPharmacistsOfNewJob },
  collab: { heading: collabHeading, ownerField: 'ownerId', notify: notifyDoctorsOfNewCollab },
  doctor_request: { heading: requestHeading, ownerField: 'doctorId', notify: notifyPharmaciesOfDoctorRequest }
};

// "pending" | "approved" | "rejected"; approved also matches legacy rows without the field
const moderationQuery = (value) => {
  if (value === 'pending' || value === 'rejected') return { moderationStatus: value };
  if (value === 'approved') return { moderationStatus: { $nin: ['pending', 'rejected'] } };
  return {};
};

/**
 * Approve or reject a member listing, e-mail the owner, and (on first approval)
 * alert nearby members. Shared by jobs and doctor chambers.
 */
const moderateListing = (Model, kind) => async (req, res) => {
  try {
    const { action } = req.body;
    const note = cleanText(req.body.note, 500);
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "approve" or "reject".' });
    }
    if (action === 'reject' && !note) {
      return res.status(400).json({ message: 'Please give the member a reason for rejecting.' });
    }

    const listing = await Model.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });

    const wasLive = !listing.moderationStatus || listing.moderationStatus === 'approved';
    listing.moderationStatus = action === 'approve' ? 'approved' : 'rejected';
    listing.moderationNote = note;
    listing.reviewedAt = new Date();
    listing.reviewedBy = req.adminUser?._id;
    await listing.save();

    const meta = LISTING_KINDS[kind];
    const owner = await ServiceUser.findById(listing[meta.ownerField]);
    const heading = meta.heading(listing);
    if (owner) {
      sendListingReviewedEmail({
        kind,
        to: owner.email,
        name: owner.name,
        userId: owner._id,
        heading,
        approved: action === 'approve',
        note
      }).catch((err) => console.error('Listing review email error:', err));

      // Nearby members only hear about a listing once it is verified
      if (action === 'approve' && !wasLive && listing.status === 'active') {
        meta.notify(listing, owner).catch((err) => console.error('Nearby member alert error:', err));
      }
    }

    res.json({
      message: action === 'approve' ? 'Listing verified and published.' : 'Listing rejected and the member has been notified.',
      listing
    });
  } catch (error) {
    console.error('Moderate listing error:', error);
    res.status(500).json({ message: 'Unable to update the listing review.' });
  }
};

exports.moderateJob = moderateListing(JobPost, 'job');
exports.moderateCollab = moderateListing(DoctorCollaborationPost, 'collab');
exports.moderateDoctorRequest = moderateListing(DoctorChamberRequest, 'doctor_request');

/** DELETE /api/services/admin/doctor-requests/:id */
exports.deleteAdminDoctorRequest = async (req, res) => {
  try {
    const request = await DoctorChamberRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ message: 'Chamber requirement not found.' });
    await DoctorRequestResponse.deleteMany({ requestId: request._id });
    res.json({ message: 'Chamber requirement deleted by administrator.' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete the chamber requirement.' });
  }
};

/**
 * Get Service Dashboard Stats for Admin
 * GET /api/services/admin/stats
 */
exports.getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalOwners,
      totalPharmacists,
      totalDoctors,
      totalActiveJobs,
      totalJobs,
      totalCollabPosts,
      totalActiveCollabs,
      totalApplications,
      totalInquiries,
      pendingJobs,
      pendingCollabs,
      pendingDoctorRequests,
      unverifiedDoctors
    ] = await Promise.all([
      ServiceUser.countDocuments(),
      ServiceUser.countDocuments({ role: 'pharmacy_owner' }),
      ServiceUser.countDocuments({ role: 'job_seeker_pharmacist' }),
      ServiceUser.countDocuments({ role: 'doctor' }),
      JobPost.countDocuments({ status: 'active' }),
      JobPost.countDocuments(),
      DoctorCollaborationPost.countDocuments(),
      DoctorCollaborationPost.countDocuments({ status: 'active' }),
      JobApplication.countDocuments(),
      DoctorCollaborationInquiry.countDocuments(),
      JobPost.countDocuments({ moderationStatus: 'pending' }),
      DoctorCollaborationPost.countDocuments({ moderationStatus: 'pending' }),
      DoctorChamberRequest.countDocuments({ moderationStatus: 'pending' }),
      ServiceUser.countDocuments({ role: 'doctor', isVerified: false })
    ]);

    res.json({
      totalUsers,
      totalOwners,
      totalPharmacists,
      totalDoctors,
      totalActiveJobs,
      totalJobs,
      totalCollabPosts,
      totalActiveCollabs,
      totalApplications,
      totalInquiries,
      pendingJobs,
      pendingCollabs,
      pendingDoctorRequests,
      unverifiedDoctors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all Service Users (Admin)
 * GET /api/services/admin/users
 */
exports.getAdminUsers = async (req, res) => {
  try {
    const { search, role, isBlocked, page = 1, limit = 50 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: escapeRegex(search), $options: 'i' } },
        { email: { $regex: escapeRegex(search), $options: 'i' } },
        { mobile: { $regex: escapeRegex(search), $options: 'i' } },
        { 'pharmacyDetails.pharmacyName': { $regex: escapeRegex(search), $options: 'i' } },
        { 'doctorDetails.specialization': { $regex: escapeRegex(search), $options: 'i' } },
        { 'location.city': { $regex: escapeRegex(search), $options: 'i' } }
      ];
    }

    if (role && role !== 'All') {
      query.role = role;
    }

    if (isBlocked !== undefined && isBlocked !== '') {
      query.isBlocked = isBlocked === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      ServiceUser.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ServiceUser.countDocuments(query)
    ]);

    res.json({
      users,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Toggle Block/Unblock Account
 * PATCH /api/services/admin/users/:id/toggle-block
 */
exports.toggleBlockUser = async (req, res) => {
  try {
    const { blockReason } = req.body;
    const user = await ServiceUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.isBlocked = !user.isBlocked;
    if (user.isBlocked) {
      user.blockReason = blockReason || 'Administrative suspension';
    } else {
      user.blockReason = '';
    }

    await user.save();

    res.json({
      message: `User account has been ${user.isBlocked ? 'blocked' : 'unblocked'}.`,
      isBlocked: user.isBlocked,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Toggle License Verification Status
 * PATCH /api/services/admin/users/:id/toggle-verify
 */
exports.toggleVerifyUser = async (req, res) => {
  try {
    const user = await ServiceUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.isVerified = !user.isVerified;
    await user.save();

    sendProfileVerificationEmail(user, user.isVerified).catch((err) => console.error('Verification email error:', err));

    res.json({
      message: `User verification status changed to ${user.isVerified ? 'Verified' : 'Unverified'}.`,
      isVerified: user.isVerified,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete User Account completely
 * DELETE /api/services/admin/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await ServiceUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Clean up all posts, applications, inquiries associated with this user
    await Promise.all([
      JobPost.deleteMany({ ownerId: user._id }),
      DoctorCollaborationPost.deleteMany({ ownerId: user._id }),
      DoctorChamberRequest.deleteMany({ doctorId: user._id }),
      JobApplication.deleteMany({ applicantId: user._id }),
      DoctorCollaborationInquiry.deleteMany({ doctorId: user._id }),
      ServiceUser.findByIdAndDelete(user._id)
    ]);

    res.json({ message: 'User account and all associated posts/applications successfully deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all Job Posts (Admin)
 * GET /api/services/admin/jobs
 */
exports.getAdminJobs = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: escapeRegex(search), $options: 'i' } },
        { pharmacyName: { $regex: escapeRegex(search), $options: 'i' } },
        { 'location.city': { $regex: escapeRegex(search), $options: 'i' } }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    Object.assign(query, moderationQuery(req.query.moderation));

    const jobs = await JobPost.find(query)
      .populate('ownerId', 'name email mobile isBlocked isVerified')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete any Job Post (Admin)
 * DELETE /api/services/admin/jobs/:id
 */
exports.deleteAdminJob = async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job post not found.' });

    await JobPost.findByIdAndDelete(req.params.id);
    await JobApplication.deleteMany({ jobId: req.params.id });

    res.json({ message: 'Job post deleted by administrator.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all Collaboration Posts (Admin)
 * GET /api/services/admin/collab-posts
 */
exports.getAdminCollabPosts = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { pharmacyName: { $regex: escapeRegex(search), $options: 'i' } },
        { clinicOrChamberName: { $regex: escapeRegex(search), $options: 'i' } },
        { specializationNeeded: { $regex: escapeRegex(search), $options: 'i' } },
        { 'location.city': { $regex: escapeRegex(search), $options: 'i' } }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    Object.assign(query, moderationQuery(req.query.moderation));

    const posts = await DoctorCollaborationPost.find(query)
      .populate('ownerId', 'name email mobile isBlocked isVerified')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete any Collaboration Post (Admin)
 * DELETE /api/services/admin/collab-posts/:id
 */
exports.deleteAdminCollabPost = async (req, res) => {
  try {
    const post = await DoctorCollaborationPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Collaboration post not found.' });

    await DoctorCollaborationPost.findByIdAndDelete(req.params.id);
    await DoctorCollaborationInquiry.deleteMany({ collabPostId: req.params.id });

    res.json({ message: 'Collaboration post deleted by administrator.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update User Details (Admin)
 * PUT /api/services/admin/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const user = await ServiceUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const updates = req.body;
    if (updates.name !== undefined) user.name = String(updates.name).trim().slice(0, 80);
    if (updates.email !== undefined) user.email = String(updates.email).trim().toLowerCase().slice(0, 120);
    if (updates.mobile !== undefined) user.mobile = String(updates.mobile).replace(/\D/g, '').slice(0, 10);
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.isVerified !== undefined) user.isVerified = Boolean(updates.isVerified);
    if (updates.isBlocked !== undefined) user.isBlocked = Boolean(updates.isBlocked);
    if (updates.blockReason !== undefined) user.blockReason = String(updates.blockReason).trim().slice(0, 250);

    if (updates.location) {
      if (updates.location.city !== undefined) user.location.city = String(updates.location.city).trim().slice(0, 60);
      if (updates.location.address !== undefined) user.location.address = String(updates.location.address).trim().slice(0, 200);
      if (updates.location.state !== undefined) user.location.state = String(updates.location.state).trim().slice(0, 60);
      if (updates.location.pincode !== undefined) user.location.pincode = String(updates.location.pincode).trim().slice(0, 10);
    }

    if (updates.pharmacyDetails && user.role === 'pharmacy_owner') {
      const p = updates.pharmacyDetails;
      user.pharmacyDetails = {
        ...user.pharmacyDetails,
        pharmacyName: p.pharmacyName !== undefined ? String(p.pharmacyName).trim().slice(0, 120) : user.pharmacyDetails?.pharmacyName,
        licenseNumber: p.licenseNumber !== undefined ? String(p.licenseNumber).trim().slice(0, 60) : user.pharmacyDetails?.licenseNumber
      };
    }
    if (updates.pharmacistDetails && user.role === 'job_seeker_pharmacist') {
      const ph = updates.pharmacistDetails;
      user.pharmacistDetails = {
        ...user.pharmacistDetails,
        qualification: ph.qualification !== undefined ? String(ph.qualification).trim().slice(0, 60) : user.pharmacistDetails?.qualification,
        licenseNumber: ph.licenseNumber !== undefined ? String(ph.licenseNumber).trim().slice(0, 60) : user.pharmacistDetails?.licenseNumber,
        experienceYears: ph.experienceYears !== undefined ? Math.max(0, Math.min(50, Number(ph.experienceYears) || 0)) : user.pharmacistDetails?.experienceYears
      };
    }
    if (updates.doctorDetails && user.role === 'doctor') {
      const d = updates.doctorDetails;
      user.doctorDetails = {
        ...user.doctorDetails,
        specialization: d.specialization !== undefined ? String(d.specialization).trim().slice(0, 80) : user.doctorDetails?.specialization,
        qualification: d.qualification !== undefined ? String(d.qualification).trim().slice(0, 60) : user.doctorDetails?.qualification,
        medicalRegistrationNumber: d.medicalRegistrationNumber !== undefined ? String(d.medicalRegistrationNumber).trim().slice(0, 60) : user.doctorDetails?.medicalRegistrationNumber,
        experienceYears: d.experienceYears !== undefined ? Math.max(0, Math.min(60, Number(d.experienceYears) || 0)) : user.doctorDetails?.experienceYears
      };
    }

    await user.save();
    res.json({ message: 'User details updated successfully by administrator.', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Toggle Job Status (Admin)
 * PATCH /api/services/admin/jobs/:id/status
 */
exports.toggleJobStatus = async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job post not found.' });

    const newStatus = req.body.status || (job.status === 'active' ? 'closed' : 'active');
    job.status = newStatus;
    await job.save();

    res.json({ message: `Job vacancy status updated to ${newStatus}.`, job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Toggle Collaboration Post Status (Admin)
 * PATCH /api/services/admin/collab-posts/:id/status
 */
exports.toggleCollabStatus = async (req, res) => {
  try {
    const post = await DoctorCollaborationPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Collaboration listing not found.' });

    const newStatus = req.body.status || (post.status === 'active' ? 'closed' : 'active');
    post.status = newStatus;
    await post.save();

    res.json({ message: `Collaboration listing status updated to ${newStatus}.`, post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

