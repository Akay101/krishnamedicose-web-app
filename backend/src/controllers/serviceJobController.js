const JobPost = require('../models/JobPost');
const JobApplication = require('../models/JobApplication');
const ServiceUser = require('../models/ServiceUser');
const { calculateDistanceKm, sanitizeCoordinates } = require('../utils/geoUtils');
const {
  notifyPharmacistsOfNewJob,
  notifyOwnerOfJobApplication,
  notifyApplicantOfStatusUpdate,
  sendJobPostConfirmationEmail
} = require('../services/serviceNotificationService');

/**
 * Create a new Job Post (Pharmacy Owner)
 * POST /api/services/jobs
 */
exports.createJobPost = async (req, res) => {
  try {
    const {
      title,
      jobType,
      requiredExperience,
      requiredQualification,
      salaryRange,
      workTimings,
      vacancies,
      description,
      requirements,
      contactPhone,
      contactEmail,
      location,
      visibilityRadiusKm
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const owner = await ServiceUser.findById(req.serviceUser._id);
    if (!owner) return res.status(404).json({ message: 'Owner account not found.' });

    // Use owner's pharmacy name or provided
    const pharmacyName = owner.pharmacyDetails?.pharmacyName || owner.name;

    // Resolve location
    let finalLocation = {
      address: owner.location?.address || '',
      city: owner.location?.city || '',
      state: owner.location?.state || '',
      pincode: owner.location?.pincode || '',
      type: 'Point',
      coordinates: owner.location?.coordinates || [77.1025, 28.7041]
    };

    if (location) {
      if (location.address) finalLocation.address = location.address;
      if (location.city) finalLocation.city = location.city;
      if (location.state) finalLocation.state = location.state;
      if (location.pincode) finalLocation.pincode = location.pincode;
      if (location.coordinates) {
        finalLocation.coordinates = sanitizeCoordinates(location.coordinates);
      }
    }

    const job = new JobPost({
      ownerId: owner._id,
      title: title.trim(),
      pharmacyName,
      jobType: jobType || 'Full-time',
      requiredExperience: requiredExperience || '1 - 2 Years',
      requiredQualification: requiredQualification || 'B.Pharm',
      salaryRange: salaryRange || 'Negotiable',
      workTimings: workTimings || 'Standard Pharmacy Shifts',
      vacancies: Number(vacancies) || 1,
      description: description.trim(),
      requirements: Array.isArray(requirements) ? requirements : (requirements ? [requirements] : []),
      contactPhone: contactPhone || owner.mobile,
      contactEmail: contactEmail || owner.email,
      location: finalLocation,
      visibilityRadiusKm: Number(visibilityRadiusKm) || 25,
      status: 'active'
    });

    await job.save();

    // Send confirmation email to the job poster
    sendJobPostConfirmationEmail(job, owner).catch((err) =>
      console.error('Job post owner confirmation email error:', err)
    );

    // Trigger notification and emails to nearby pharmacists asynchronously
    notifyPharmacistsOfNewJob(job, owner).catch((err) =>
      console.error('Job notification trigger error:', err)
    );

    res.status(201).json({
      message: 'Job posting published successfully.',
      job
    });
  } catch (error) {
    console.error('Create Job Post Error:', error);
    res.status(500).json({ message: error.message || 'Error creating job post.' });
  }
};

/**
 * Get jobs posted by the logged-in owner
 * GET /api/services/jobs/my-jobs
 */
exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await JobPost.find({ ownerId: req.serviceUser._id })
      .sort({ createdAt: -1 })
      .lean();

    // Populate applications counts accurately
    for (const job of jobs) {
      job.applicationsCount = await JobApplication.countDocuments({ jobId: job._id });
    }

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update an existing job post
 * PUT /api/services/jobs/:id
 */
exports.updateJobPost = async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job post not found.' });

    // Verify ownership or platform admin
    if (!req.isAdmin && job.ownerId.toString() !== req.serviceUser._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to modify this job posting.' });
    }

    const updates = req.body;
    const allowedFields = [
      'title',
      'pharmacyName',
      'jobType',
      'requiredExperience',
      'requiredQualification',
      'salaryRange',
      'workTimings',
      'vacancies',
      'description',
      'requirements',
      'contactPhone',
      'contactEmail',
      'visibilityRadiusKm',
      'status'
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        job[field] = updates[field];
      }
    });

    if (updates.location) {
      if (updates.location.address !== undefined) job.location.address = updates.location.address;
      if (updates.location.city !== undefined) job.location.city = updates.location.city;
      if (updates.location.state !== undefined) job.location.state = updates.location.state;
      if (updates.location.pincode !== undefined) job.location.pincode = updates.location.pincode;
      if (updates.location.coordinates) {
        job.location.coordinates = sanitizeCoordinates(updates.location.coordinates);
      }
    }

    await job.save();

    res.json({
      message: 'Job post updated successfully.',
      job
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete / Close a job post
 * DELETE /api/services/jobs/:id
 */
exports.deleteJobPost = async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job post not found.' });

    if (!req.isAdmin && job.ownerId.toString() !== req.serviceUser._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this post.' });
    }

    await JobPost.findByIdAndDelete(req.params.id);
    // Also remove associated applications
    await JobApplication.deleteMany({ jobId: req.params.id });

    res.json({ message: 'Job post and associated applications removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Job Feed (For Pharmacists looking for work)
 * GET /api/services/jobs/feed
 */
exports.getJobFeed = async (req, res) => {
  try {
    const {
      search,
      experience,
      qualification,
      jobType,
      lat,
      lng,
      radiusKm
    } = req.query;

    // Determine target location for proximity
    let userLat = lat ? parseFloat(lat) : null;
    let userLng = lng ? parseFloat(lng) : null;

    if ((userLat === null || userLng === null) && req.serviceUser?.location?.coordinates) {
      userLng = req.serviceUser.location.coordinates[0];
      userLat = req.serviceUser.location.coordinates[1];
    }

    // Build query
    const query = { status: 'active' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { pharmacyName: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (experience && experience !== 'All') {
      query.requiredExperience = experience;
    }

    if (qualification && qualification !== 'All') {
      query.requiredQualification = qualification;
    }

    if (jobType && jobType !== 'All') {
      query.jobType = jobType;
    }

    const allActiveJobs = await JobPost.find(query)
      .populate('ownerId', 'name mobile email isVerified pharmacyDetails')
      .lean();

    // Check if user has applied
    let appliedJobIds = new Set();
    if (req.serviceUser) {
      const myApplications = await JobApplication.find({
        applicantId: req.serviceUser._id
      }).select('jobId');
      appliedJobIds = new Set(myApplications.map((app) => app.jobId.toString()));
    }

    // Calculate distance and filter by visibility radius
    const filteredJobs = allActiveJobs.map((job) => {
      let distanceKm = null;
      if (
        userLat !== null &&
        userLng !== null &&
        job.location?.coordinates &&
        job.location.coordinates.length === 2
      ) {
        distanceKm = calculateDistanceKm(
          userLat,
          userLng,
          job.location.coordinates[1],
          job.location.coordinates[0]
        );
      }

      return {
        ...job,
        distanceKm,
        hasApplied: appliedJobIds.has(job._id.toString())
      };
    });

    // Filter by radius if specified or within job's own radius
    const maxRadius = radiusKm ? parseFloat(radiusKm) : null;

    const results = filteredJobs.filter((job) => {
      if (job.distanceKm === null) return true; // Keep if coordinates unavailable
      if (maxRadius && job.distanceKm > maxRadius) return false;
      // Job visibility radius check
      if (job.visibilityRadiusKm && job.distanceKm > job.visibilityRadiusKm * 1.5) {
        // Allow slightly wider scope if user explicitly widened, otherwise restrict
        if (!maxRadius) return false;
      }
      return true;
    });

    // Sort by proximity if distance is available, else newest first
    results.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const isAuth = Boolean(req.serviceUser);
    const sanitized = results.map((job) => ({
      ...job,
      contactPhone: isAuth ? job.contactPhone : null,
      contactEmail: isAuth ? job.contactEmail : null,
      ownerId: job.ownerId ? {
        _id: job.ownerId._id,
        name: job.ownerId.name,
        mobile: isAuth ? job.ownerId.mobile : null,
        email: isAuth ? job.ownerId.email : null,
        pharmacyDetails: job.ownerId.pharmacyDetails,
        isVerified: job.ownerId.isVerified
      } : null,
      isContactLocked: !isAuth
    }));

    res.json(sanitized);
  } catch (error) {
    console.error('Job Feed Error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Job Details by ID
 * GET /api/services/jobs/:id
 */
exports.getJobById = async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id)
      .populate('ownerId', 'name mobile email pharmacyDetails isVerified')
      .lean();

    if (!job) return res.status(404).json({ message: 'Job not found.' });

    let hasApplied = false;
    if (req.serviceUser) {
      const app = await JobApplication.findOne({
        jobId: job._id,
        applicantId: req.serviceUser._id
      });
      hasApplied = Boolean(app);
    }

    res.json({ ...job, hasApplied });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Apply for a Job Post (Pharmacist)
 * POST /api/services/jobs/:id/apply
 */
exports.applyForJob = async (req, res) => {
  try {
    const applicant = await ServiceUser.findById(req.serviceUser._id);
    if (!applicant) return res.status(404).json({ message: 'Applicant account not found.' });

    const job = await JobPost.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job post not found.' });

    if (job.status !== 'active') {
      return res.status(400).json({ message: 'This job vacancy is no longer accepting applications.' });
    }

    // Check duplicate
    const existing = await JobApplication.findOne({
      jobId: job._id,
      applicantId: applicant._id
    });

    if (existing) {
      return res.status(409).json({ message: 'You have already submitted an application for this position.' });
    }

    const { coverNote, mobile, qualification, experienceYears } = req.body;

    const application = new JobApplication({
      jobId: job._id,
      applicantId: applicant._id,
      ownerId: job.ownerId,
      applicantName: applicant.name,
      applicantMobile: mobile || applicant.mobile,
      applicantEmail: applicant.email,
      qualification: qualification || applicant.pharmacistDetails?.qualification || 'B.Pharm',
      experienceYears: experienceYears !== undefined ? Number(experienceYears) : (applicant.pharmacistDetails?.experienceYears || 0),
      licenseNumber: applicant.pharmacistDetails?.licenseNumber || '',
      coverNote: (coverNote || '').trim(),
      status: 'pending'
    });

    await application.save();

    // Increment count
    await JobPost.findByIdAndUpdate(job._id, { $inc: { applicationsCount: 1 } });

    // Trigger notification and emails to pharmacy owner asynchronously
    notifyOwnerOfJobApplication(application, job, applicant).catch((err) =>
      console.error('Application notification trigger error:', err)
    );

    res.status(201).json({
      message: 'Application submitted successfully to the pharmacy owner.',
      application
    });
  } catch (error) {
    console.error('Job Application Error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Applications for a specific Job or all owner's jobs
 * GET /api/services/jobs/:id/applications
 */
exports.getJobApplications = async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job post not found.' });

    if (!req.isAdmin && job.ownerId.toString() !== req.serviceUser._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to view applicants for this post.' });
    }

    const applications = await JobApplication.find({ jobId: job._id })
      .populate('applicantId', 'name mobile email pharmacistDetails location isVerified')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update application status (Owner shortlisting/reviewing)
 * PATCH /api/services/jobs/applications/:appId/status
 */
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'shortlisted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update.' });
    }

    const application = await JobApplication.findById(req.params.appId);
    if (!application) return res.status(404).json({ message: 'Application not found.' });

    if (!req.isAdmin && application.ownerId.toString() !== req.serviceUser._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to modify this application.' });
    }

    application.status = status;
    await application.save();

    // Trigger notification and emails to applicant asynchronously
    JobPost.findById(application.jobId).then((job) => {
      if (job) {
        notifyApplicantOfStatusUpdate(application, job, status).catch((err) =>
          console.error('Status notification trigger error:', err)
        );
      }
    });

    res.json({
      message: `Candidate application marked as ${status}.`,
      application
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get my submitted applications (Pharmacist)
 * GET /api/services/jobs/my-applications
 */
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await JobApplication.find({ applicantId: req.serviceUser._id })
      .populate({
        path: 'jobId',
        select: 'title pharmacyName location salaryRange jobType status'
      })
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
