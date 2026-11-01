const DoctorCollaborationPost = require('../models/DoctorCollaborationPost');
const DoctorCollaborationInquiry = require('../models/DoctorCollaborationInquiry');
const ServiceUser = require('../models/ServiceUser');
const { calculateDistanceKm, sanitizeCoordinates } = require('../utils/geoUtils');
const {
  notifyDoctorsOfNewCollab,
  notifyOwnerOfDoctorInquiry,
  notifyDoctorOfInquiryStatusUpdate,
  sendCollabPostConfirmationEmail
} = require('../services/serviceNotificationService');

/**
 * Create a new Doctor Collaboration Post (Pharmacy Owner)
 * POST /api/services/collab-posts
 */
exports.createCollabPost = async (req, res) => {
  try {
    const {
      pharmacyName,
      clinicOrChamberName,
      specializationNeeded,
      chamberFacilities,
      preferredTimings,
      consultationDays,
      collaborationTerms,
      description,
      contactPhone,
      contactEmail,
      location,
      visibilityRadiusKm
    } = req.body;

    if (!specializationNeeded || !preferredTimings || !description) {
      return res.status(400).json({
        message: 'Doctor specialization needed, preferred timings, and description are required.'
      });
    }

    const cleanSpec = String(specializationNeeded).trim();
    if (cleanSpec.length < 2 || cleanSpec.length > 80) {
      return res.status(400).json({ message: 'Specialization needed must be between 2 and 80 characters.' });
    }

    const cleanTimings = String(preferredTimings).trim();
    if (cleanTimings.length < 2 || cleanTimings.length > 80) {
      return res.status(400).json({ message: 'Preferred timings must be between 2 and 80 characters.' });
    }

    const cleanDesc = String(description).trim();
    if (cleanDesc.length < 10 || cleanDesc.length > 1000) {
      return res.status(400).json({ message: 'Description must be between 10 and 1000 characters.' });
    }

    const cleanClinic = clinicOrChamberName ? String(clinicOrChamberName).trim().slice(0, 120) : '';
    const cleanDays = consultationDays ? String(consultationDays).trim().slice(0, 80) : 'Monday to Saturday';
    const cleanTerms = collaborationTerms ? String(collaborationTerms).trim().slice(0, 120) : 'Revenue Share / Negotiable';
    const cleanRadius = Math.max(5, Math.min(100, Number(visibilityRadiusKm) || 30));

    const owner = await ServiceUser.findById(req.serviceUser._id);
    if (!owner) return res.status(404).json({ message: 'Owner profile not found.' });

    let finalLocation = {
      address: (owner.location?.address || '').slice(0, 200),
      city: (owner.location?.city || '').slice(0, 60),
      state: (owner.location?.state || '').slice(0, 60),
      pincode: (owner.location?.pincode || '').slice(0, 10),
      type: 'Point',
      coordinates: owner.location?.coordinates || [77.1025, 28.7041]
    };

    if (location) {
      if (location.address) finalLocation.address = String(location.address).trim().slice(0, 200);
      if (location.city) finalLocation.city = String(location.city).trim().slice(0, 60);
      if (location.state) finalLocation.state = String(location.state).trim().slice(0, 60);
      if (location.pincode) finalLocation.pincode = String(location.pincode).trim().slice(0, 10);
      if (location.coordinates) {
        finalLocation.coordinates = sanitizeCoordinates(location.coordinates);
      }
    }

    let facilities = ['Consultation Room', 'Attached Pharmacy'];
    if (Array.isArray(chamberFacilities)) {
      facilities = chamberFacilities
        .map((f) => String(f).trim().slice(0, 100))
        .filter((f) => f.length > 0)
        .slice(0, 15);
    } else if (chamberFacilities) {
      facilities = [String(chamberFacilities).trim().slice(0, 100)];
    }

    const post = new DoctorCollaborationPost({
      ownerId: owner._id,
      pharmacyName: (pharmacyName || owner.pharmacyDetails?.pharmacyName || owner.name || '').slice(0, 120),
      clinicOrChamberName: cleanClinic,
      specializationNeeded: cleanSpec,
      chamberFacilities: facilities,
      preferredTimings: cleanTimings,
      consultationDays: cleanDays,
      collaborationTerms: cleanTerms,
      description: cleanDesc,
      contactPhone: contactPhone || owner.mobile,
      contactEmail: contactEmail || owner.email,
      location: finalLocation,
      visibilityRadiusKm: cleanRadius,
      status: 'active'
    });

    await post.save();

    // Send confirmation email to the poster
    sendCollabPostConfirmationEmail(post, owner).catch((err) =>
      console.error('Collab post owner confirmation email error:', err)
    );

    // Trigger notification and emails to nearby doctors asynchronously
    notifyDoctorsOfNewCollab(post, owner).catch((err) =>
      console.error('Collab notification trigger error:', err)
    );

    res.status(201).json({
      message: 'Doctor collaboration listing created successfully.',
      post
    });
  } catch (error) {
    console.error('Create Collab Post Error:', error);
    res.status(500).json({ message: error.message || 'Error creating collaboration listing.' });
  }
};

/**
 * Get posts created by the logged-in owner
 * GET /api/services/collab-posts/my-posts
 */
exports.getMyCollabPosts = async (req, res) => {
  try {
    const posts = await DoctorCollaborationPost.find({ ownerId: req.serviceUser._id })
      .sort({ createdAt: -1 })
      .lean();

    for (const post of posts) {
      post.inquiriesCount = await DoctorCollaborationInquiry.countDocuments({ collabPostId: post._id });
    }

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update an existing collaboration post
 * PUT /api/services/collab-posts/:id
 */
exports.updateCollabPost = async (req, res) => {
  try {
    const post = await DoctorCollaborationPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Collaboration listing not found.' });

    if (!req.isAdmin && post.ownerId.toString() !== req.serviceUser._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to modify this listing.' });
    }

    const updates = req.body;
    if (updates.specializationNeeded !== undefined) {
      const cleanSpec = String(updates.specializationNeeded).trim();
      if (cleanSpec.length < 2 || cleanSpec.length > 80) {
        return res.status(400).json({ message: 'Specialization needed must be between 2 and 80 characters.' });
      }
      post.specializationNeeded = cleanSpec;
    }

    if (updates.preferredTimings !== undefined) {
      const cleanTimings = String(updates.preferredTimings).trim();
      if (cleanTimings.length < 2 || cleanTimings.length > 80) {
        return res.status(400).json({ message: 'Preferred timings must be between 2 and 80 characters.' });
      }
      post.preferredTimings = cleanTimings;
    }

    if (updates.description !== undefined) {
      const cleanDesc = String(updates.description).trim();
      if (cleanDesc.length < 10 || cleanDesc.length > 1000) {
        return res.status(400).json({ message: 'Description must be between 10 and 1000 characters.' });
      }
      post.description = cleanDesc;
    }

    if (updates.pharmacyName !== undefined) post.pharmacyName = String(updates.pharmacyName).trim().slice(0, 120);
    if (updates.clinicOrChamberName !== undefined) post.clinicOrChamberName = String(updates.clinicOrChamberName).trim().slice(0, 120);
    if (updates.consultationDays !== undefined) post.consultationDays = String(updates.consultationDays).trim().slice(0, 80);
    if (updates.collaborationTerms !== undefined) post.collaborationTerms = String(updates.collaborationTerms).trim().slice(0, 120);
    if (updates.visibilityRadiusKm !== undefined) post.visibilityRadiusKm = Math.max(5, Math.min(100, Number(updates.visibilityRadiusKm) || 30));
    if (updates.status !== undefined) post.status = ['active', 'closed', 'paused'].includes(updates.status) ? updates.status : post.status;

    if (updates.chamberFacilities !== undefined) {
      if (Array.isArray(updates.chamberFacilities)) {
        post.chamberFacilities = updates.chamberFacilities
          .map((f) => String(f).trim().slice(0, 100))
          .filter((f) => f.length > 0)
          .slice(0, 15);
      } else if (updates.chamberFacilities) {
        post.chamberFacilities = [String(updates.chamberFacilities).trim().slice(0, 100)];
      }
    }

    if (updates.contactPhone !== undefined) post.contactPhone = String(updates.contactPhone).trim().slice(0, 20);
    if (updates.contactEmail !== undefined) post.contactEmail = String(updates.contactEmail).trim().slice(0, 120);

    if (updates.location) {
      if (updates.location.address !== undefined) post.location.address = String(updates.location.address).trim().slice(0, 200);
      if (updates.location.city !== undefined) post.location.city = String(updates.location.city).trim().slice(0, 60);
      if (updates.location.state !== undefined) post.location.state = String(updates.location.state).trim().slice(0, 60);
      if (updates.location.pincode !== undefined) post.location.pincode = String(updates.location.pincode).trim().slice(0, 10);
      if (updates.location.coordinates) {
        post.location.coordinates = sanitizeCoordinates(updates.location.coordinates);
      }
    }

    await post.save();

    res.json({
      message: 'Collaboration listing updated successfully.',
      post
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete collaboration post
 * DELETE /api/services/collab-posts/:id
 */
exports.deleteCollabPost = async (req, res) => {
  try {
    const post = await DoctorCollaborationPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Collaboration post not found.' });

    if (!req.isAdmin && post.ownerId.toString() !== req.serviceUser._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this post.' });
    }

    await DoctorCollaborationPost.findByIdAndDelete(req.params.id);
    await DoctorCollaborationInquiry.deleteMany({ collabPostId: req.params.id });

    res.json({ message: 'Collaboration listing removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Feed for Doctors looking for clinic/pharmacy collaboration
 * GET /api/services/collab-posts/feed
 */
exports.getCollabFeed = async (req, res) => {
  try {
    const {
      search,
      specialization,
      lat,
      lng,
      radiusKm
    } = req.query;

    let userLat = lat ? parseFloat(lat) : null;
    let userLng = lng ? parseFloat(lng) : null;

    if ((userLat === null || userLng === null) && req.serviceUser?.location?.coordinates) {
      userLng = req.serviceUser.location.coordinates[0];
      userLat = req.serviceUser.location.coordinates[1];
    }

    const query = { status: 'active' };

    if (search) {
      query.$or = [
        { pharmacyName: { $regex: search, $options: 'i' } },
        { clinicOrChamberName: { $regex: search, $options: 'i' } },
        { specializationNeeded: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (specialization && specialization !== 'All') {
      query.specializationNeeded = { $regex: specialization, $options: 'i' };
    }

    const posts = await DoctorCollaborationPost.find(query)
      .populate('ownerId', 'name mobile email isVerified pharmacyDetails')
      .lean();

    let inquiredPostIds = new Set();
    if (req.serviceUser) {
      const myInquiries = await DoctorCollaborationInquiry.find({
        doctorId: req.serviceUser._id
      }).select('collabPostId');
      inquiredPostIds = new Set(myInquiries.map((inq) => inq.collabPostId.toString()));
    }

    const filtered = posts.map((post) => {
      let distanceKm = null;
      if (
        userLat !== null &&
        userLng !== null &&
        post.location?.coordinates &&
        post.location.coordinates.length === 2
      ) {
        distanceKm = calculateDistanceKm(
          userLat,
          userLng,
          post.location.coordinates[1],
          post.location.coordinates[0]
        );
      }

      return {
        ...post,
        distanceKm,
        hasInquired: inquiredPostIds.has(post._id.toString())
      };
    });

    const maxRadius = radiusKm ? parseFloat(radiusKm) : null;

    const results = filtered.filter((post) => {
      if (post.distanceKm === null) return true;
      if (maxRadius && post.distanceKm > maxRadius) return false;
      if (post.visibilityRadiusKm && post.distanceKm > post.visibilityRadiusKm * 1.5) {
        if (!maxRadius) return false;
      }
      return true;
    });

    results.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const isAuth = Boolean(req.serviceUser);
    const sanitized = results.map((post) => ({
      ...post,
      contactPhone: isAuth ? post.contactPhone : null,
      contactEmail: isAuth ? post.contactEmail : null,
      ownerId: post.ownerId ? {
        _id: post.ownerId._id,
        name: post.ownerId.name,
        mobile: isAuth ? post.ownerId.mobile : null,
        email: isAuth ? post.ownerId.email : null,
        pharmacyDetails: post.ownerId.pharmacyDetails,
        isVerified: post.ownerId.isVerified
      } : null,
      isContactLocked: !isAuth
    }));

    res.json(sanitized);
  } catch (error) {
    console.error('Collab Feed Error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get single collaboration post
 * GET /api/services/collab-posts/:id
 */
exports.getCollabPostById = async (req, res) => {
  try {
    const post = await DoctorCollaborationPost.findById(req.params.id)
      .populate('ownerId', 'name mobile email isVerified pharmacyDetails')
      .lean();

    if (!post) return res.status(404).json({ message: 'Collaboration listing not found.' });

    let hasInquired = false;
    if (req.serviceUser) {
      const inq = await DoctorCollaborationInquiry.findOne({
        collabPostId: post._id,
        doctorId: req.serviceUser._id
      });
      hasInquired = Boolean(inq);
    }

    res.json({ ...post, hasInquired });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Inquire / Express Interest in collaboration (Doctor)
 * POST /api/services/collab-posts/:id/inquire
 */
exports.inquireCollabPost = async (req, res) => {
  try {
    const doctor = await ServiceUser.findById(req.serviceUser._id);
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found.' });

    const post = await DoctorCollaborationPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Collaboration post not found.' });

    if (post.status !== 'active') {
      return res.status(400).json({ message: 'This collaboration listing is currently paused or closed.' });
    }

    const existing = await DoctorCollaborationInquiry.findOne({
      collabPostId: post._id,
      doctorId: doctor._id
    });

    if (existing) {
      return res.status(409).json({ message: 'You have already expressed interest in this collaboration.' });
    }

    const { message, proposedTimings, mobile, specialization } = req.body;

    const cleanMessage = message ? String(message).trim().slice(0, 500) : '';
    const cleanProposed = proposedTimings ? String(proposedTimings).trim().slice(0, 80) : '';
    const cleanMobile = mobile ? String(mobile).replace(/\D/g, '').slice(0, 10) : doctor.mobile;
    const cleanSpec = specialization ? String(specialization).trim().slice(0, 80) : (doctor.doctorDetails?.specialization || 'Medical Specialist');

    const inquiry = new DoctorCollaborationInquiry({
      collabPostId: post._id,
      doctorId: doctor._id,
      ownerId: post.ownerId,
      doctorName: doctor.name,
      doctorMobile: cleanMobile,
      doctorEmail: doctor.email,
      specialization: cleanSpec,
      qualification: (doctor.doctorDetails?.qualification || '').slice(0, 60),
      medicalRegistrationNumber: (doctor.doctorDetails?.medicalRegistrationNumber || '').slice(0, 60),
      experienceYears: Math.max(0, Math.min(60, Number(doctor.doctorDetails?.experienceYears) || 0)),
      message: cleanMessage,
      proposedTimings: cleanProposed,
      status: 'pending'
    });

    await inquiry.save();

    await DoctorCollaborationPost.findByIdAndUpdate(post._id, { $inc: { inquiriesCount: 1 } });

    // Trigger notification and emails to pharmacy owner asynchronously
    notifyOwnerOfDoctorInquiry(inquiry, post, doctor).catch((err) =>
      console.error('Inquiry notification trigger error:', err)
    );

    res.status(201).json({
      message: 'Collaboration proposal sent to the clinic/pharmacy owner.',
      inquiry
    });
  } catch (error) {
    console.error('Inquire Error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Inquiries for a specific post (Owner)
 * GET /api/services/collab-posts/:id/inquiries
 */
exports.getCollabInquiries = async (req, res) => {
  try {
    const post = await DoctorCollaborationPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    if (!req.isAdmin && post.ownerId.toString() !== req.serviceUser._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const inquiries = await DoctorCollaborationInquiry.find({ collabPostId: post._id })
      .populate('doctorId', 'name mobile email doctorDetails location isVerified')
      .sort({ createdAt: -1 });

    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update Inquiry Status (Owner)
 * PATCH /api/services/collab-posts/inquiries/:inqId/status
 */
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'contacted', 'accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update.' });
    }

    const inquiry = await DoctorCollaborationInquiry.findById(req.params.inqId);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

    if (!req.isAdmin && inquiry.ownerId.toString() !== req.serviceUser._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this inquiry.' });
    }

    inquiry.status = status;
    await inquiry.save();

    // Trigger notification and emails to doctor asynchronously
    DoctorCollaborationPost.findById(inquiry.collabPostId).then((collab) => {
      if (collab) {
        notifyDoctorOfInquiryStatusUpdate(inquiry, collab, status).catch((err) =>
          console.error('Inquiry status notification error:', err)
        );
      }
    });

    res.json({
      message: `Inquiry status updated to ${status}.`,
      inquiry
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Inquiries sent by doctor
 * GET /api/services/collab-posts/my-inquiries
 */
exports.getMyInquiries = async (req, res) => {
  try {
    const inquiries = await DoctorCollaborationInquiry.find({ doctorId: req.serviceUser._id })
      .populate({
        path: 'collabPostId',
        select: 'pharmacyName clinicOrChamberName specializationNeeded preferredTimings collaborationTerms location status'
      })
      .sort({ createdAt: -1 });

    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
