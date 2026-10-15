const ServiceUser = require('../models/ServiceUser');
const JobPost = require('../models/JobPost');
const DoctorCollaborationPost = require('../models/DoctorCollaborationPost');
const JobApplication = require('../models/JobApplication');
const DoctorCollaborationInquiry = require('../models/DoctorCollaborationInquiry');

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
      totalInquiries
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
      DoctorCollaborationInquiry.countDocuments()
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
      totalInquiries
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
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { 'pharmacyDetails.pharmacyName': { $regex: search, $options: 'i' } },
        { 'doctorDetails.specialization': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
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
        { title: { $regex: search, $options: 'i' } },
        { pharmacyName: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

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
        { pharmacyName: { $regex: search, $options: 'i' } },
        { clinicOrChamberName: { $regex: search, $options: 'i' } },
        { specializationNeeded: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

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
    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.email !== undefined) user.email = updates.email.trim().toLowerCase();
    if (updates.mobile !== undefined) user.mobile = updates.mobile.trim();
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.isVerified !== undefined) user.isVerified = Boolean(updates.isVerified);
    if (updates.isBlocked !== undefined) user.isBlocked = Boolean(updates.isBlocked);
    if (updates.blockReason !== undefined) user.blockReason = updates.blockReason;

    if (updates.location) {
      if (updates.location.city !== undefined) user.location.city = updates.location.city;
      if (updates.location.address !== undefined) user.location.address = updates.location.address;
      if (updates.location.state !== undefined) user.location.state = updates.location.state;
      if (updates.location.pincode !== undefined) user.location.pincode = updates.location.pincode;
    }

    if (updates.pharmacyDetails && user.role === 'pharmacy_owner') {
      user.pharmacyDetails = { ...user.pharmacyDetails, ...updates.pharmacyDetails };
    }
    if (updates.pharmacistDetails && user.role === 'job_seeker_pharmacist') {
      user.pharmacistDetails = { ...user.pharmacistDetails, ...updates.pharmacistDetails };
    }
    if (updates.doctorDetails && user.role === 'doctor') {
      user.doctorDetails = { ...user.doctorDetails, ...updates.doctorDetails };
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

