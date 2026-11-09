const DoctorChamberRequest = require('../models/DoctorChamberRequest');
const DoctorRequestResponse = require('../models/DoctorRequestResponse');
const DoctorCollaborationPost = require('../models/DoctorCollaborationPost');
const ServiceUser = require('../models/ServiceUser');
const Notification = require('../models/Notification');
const { calculateDistanceKm, sanitizeCoordinates } = require('../utils/geoUtils');
const { escapeRegex, cleanText } = require('../utils/security');
const { PUBLIC_LISTING_FILTER, isPubliclyVisible, touchesContent } = require('../utils/moderation');
const {
  sendListingSubmittedEmail,
  notifyAdminOfListingSubmission,
  notifyDoctorOfChamberOffer
} = require('../services/serviceNotificationService');

const requestHeading = (r) => `${r.specialization} - ${r.location?.city || 'chamber needed'}`;
exports.requestHeading = requestHeading;

const requestRows = (r) => [
  ['Specialization', r.specialization],
  ['Preferred timings', `${r.preferredTimings} (${r.consultationDays})`],
  ['Expected terms', r.expectedTerms],
  ['Preferred area', [r.location?.address, r.location?.city].filter(Boolean).join(', ')]
];

const announceRequest = async (request, doctor, isUpdate = false) => {
  await sendListingSubmittedEmail({
    kind: 'doctor_request',
    to: doctor.email,
    name: doctor.name,
    userId: doctor._id,
    heading: requestHeading(request),
    rows: requestRows(request),
    isUpdate
  });
  await notifyAdminOfListingSubmission({
    kind: 'doctor_request',
    heading: requestHeading(request),
    submitterName: `Dr. ${doctor.name}`,
    submitterEmail: doctor.email,
    rows: [
      ['Doctor verified', doctor.isVerified ? 'Yes' : 'No - profile also needs verification'],
      ['Registration no.', doctor.doctorDetails?.medicalRegistrationNumber],
      ...requestRows(request)
    ],
    isUpdate
  });
};

// Normalise create / update input (only known fields, bounded lengths)
const applyFields = (target, body, isCreate) => {
  const set = (key, value) => {
    if (value !== undefined) target[key] = value;
  };
  if (isCreate || body.title !== undefined) set('title', cleanText(body.title, 120));
  if (isCreate || body.specialization !== undefined) set('specialization', cleanText(body.specialization, 80));
  if (body.qualification !== undefined) set('qualification', cleanText(body.qualification, 60));
  if (body.experienceYears !== undefined) set('experienceYears', Math.max(0, Math.min(60, Number(body.experienceYears) || 0)));
  if (isCreate || body.preferredTimings !== undefined) set('preferredTimings', cleanText(body.preferredTimings, 80));
  if (body.consultationDays !== undefined) set('consultationDays', cleanText(body.consultationDays, 80) || 'Monday to Saturday');
  if (body.expectedTerms !== undefined) set('expectedTerms', cleanText(body.expectedTerms, 120) || 'Revenue share / Negotiable');
  if (body.requirements !== undefined && Array.isArray(body.requirements)) {
    set('requirements', body.requirements.map((x) => cleanText(x, 100)).filter(Boolean).slice(0, 12));
  }
  if (isCreate || body.description !== undefined) set('description', cleanText(body.description, 1000));
  if (body.searchRadiusKm !== undefined) set('searchRadiusKm', Math.max(1, Math.min(100, Number(body.searchRadiusKm) || 15)));
  if (body.status !== undefined && ['active', 'paused', 'closed'].includes(body.status)) set('status', body.status);
  if (body.location && typeof body.location === 'object') {
    const loc = target.location || {};
    target.location = {
      type: 'Point',
      address: body.location.address !== undefined ? cleanText(body.location.address, 200) : loc.address,
      city: body.location.city !== undefined ? cleanText(body.location.city, 60) : loc.city,
      state: body.location.state !== undefined ? cleanText(body.location.state, 60) : loc.state,
      pincode: body.location.pincode !== undefined ? cleanText(body.location.pincode, 10) : loc.pincode,
      coordinates: body.location.coordinates ? sanitizeCoordinates(body.location.coordinates) : loc.coordinates
    };
  }
};

const validate = (r) => {
  if (!r.title || r.title.length < 3) return 'Please add a short title (at least 3 characters).';
  if (!r.specialization || r.specialization.length < 2) return 'Please add your specialization.';
  if (!r.preferredTimings || r.preferredTimings.length < 2) return 'Please add your preferred consultation timings.';
  if (!r.description || r.description.length < 10) return 'Please describe what you are looking for (at least 10 characters).';
  return null;
};

// Contact details of the doctor are only revealed to signed-in members
const publicView = (r, isAuth, viewer) => {
  const doctor = r.doctorId && r.doctorId._id ? r.doctorId : null;
  return {
    ...r,
    doctorId: doctor
      ? {
          _id: doctor._id,
          name: doctor.name,
          isVerified: doctor.isVerified,
          doctorDetails: doctor.doctorDetails
            ? {
                specialization: doctor.doctorDetails.specialization,
                qualification: doctor.doctorDetails.qualification,
                experienceYears: doctor.doctorDetails.experienceYears
              }
            : undefined,
          mobile: isAuth ? doctor.mobile : null,
          email: isAuth ? doctor.email : null
        }
      : r.doctorId,
    location: r.location
      ? { ...r.location, address: isAuth ? r.location.address : undefined }
      : r.location,
    isContactLocked: !isAuth,
    hasResponded: Boolean(viewer && r._respondedBy?.includes(String(viewer)))
  };
};

/** POST /api/services/doctor-requests (doctor) */
exports.createRequest = async (req, res) => {
  try {
    const doctor = await ServiceUser.findById(req.serviceUser._id);
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found.' });

    const request = new DoctorChamberRequest({
      doctorId: doctor._id,
      qualification: doctor.doctorDetails?.qualification,
      experienceYears: doctor.doctorDetails?.experienceYears || 0,
      location: doctor.location,
      moderationStatus: 'pending',
      status: 'active'
    });
    applyFields(request, req.body, true);
    if (!request.specialization) request.specialization = doctor.doctorDetails?.specialization || '';

    const problem = validate(request);
    if (problem) return res.status(400).json({ message: problem });

    const openCount = await DoctorChamberRequest.countDocuments({ doctorId: doctor._id, status: { $ne: 'closed' } });
    if (openCount >= 5) {
      return res.status(400).json({ message: 'You can keep up to 5 open chamber requirements. Close an old one first.' });
    }

    await request.save();
    announceRequest(request, doctor).catch((err) => console.error('Doctor request email error:', err));

    res.status(201).json({
      message: 'Chamber requirement submitted. It will go live after verification by Krishna Medicose.',
      request
    });
  } catch (error) {
    console.error('Create doctor request error:', error);
    res.status(500).json({ message: 'Unable to submit your chamber requirement.' });
  }
};

/** GET /api/services/doctor-requests/my-requests (doctor) */
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await DoctorChamberRequest.find({ doctorId: req.serviceUser._id }).sort({ createdAt: -1 }).lean();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load your chamber requirements.' });
  }
};

/** PUT /api/services/doctor-requests/:id (owner doctor) and /admin/doctor-requests/:id */
exports.updateRequest = async (req, res) => {
  try {
    const request = await DoctorChamberRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Chamber requirement not found.' });
    if (!req.isAdmin && String(request.doctorId) !== String(req.serviceUser._id)) {
      return res.status(403).json({ message: 'You can only edit your own chamber requirements.' });
    }

    applyFields(request, req.body, false);
    const problem = validate(request);
    if (problem) return res.status(400).json({ message: problem });

    const needsReview = !req.isAdmin && touchesContent(req.body);
    if (needsReview) {
      request.moderationStatus = 'pending';
      request.moderationNote = '';
    }
    await request.save();

    if (needsReview) {
      const doctor = await ServiceUser.findById(request.doctorId);
      if (doctor) announceRequest(request, doctor, true).catch((err) => console.error('Doctor request email error:', err));
    }

    res.json({
      message: needsReview
        ? 'Changes saved and sent for verification. The requirement is hidden until approved.'
        : 'Chamber requirement updated.',
      request
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update the chamber requirement.' });
  }
};

/** DELETE /api/services/doctor-requests/:id (owner doctor) and /admin/doctor-requests/:id */
exports.deleteRequest = async (req, res) => {
  try {
    const request = await DoctorChamberRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Chamber requirement not found.' });
    if (!req.isAdmin && String(request.doctorId) !== String(req.serviceUser._id)) {
      return res.status(403).json({ message: 'You can only delete your own chamber requirements.' });
    }
    await DoctorChamberRequest.findByIdAndDelete(request._id);
    await DoctorRequestResponse.deleteMany({ requestId: request._id });
    res.json({ message: 'Chamber requirement removed.' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete the chamber requirement.' });
  }
};

/** GET /api/services/doctor-requests/feed (public preview; verified only) */
exports.getFeed = async (req, res) => {
  try {
    const { search, lat, lng, radiusKm } = req.query;
    const query = { status: 'active', ...PUBLIC_LISTING_FILTER };
    if (typeof search === 'string' && search.trim()) {
      const rx = { $regex: escapeRegex(search.trim()), $options: 'i' };
      query.$or = [{ title: rx }, { specialization: rx }, { 'location.city': rx }, { description: rx }];
    }

    let originLat = lat !== undefined ? parseFloat(lat) : null;
    let originLng = lng !== undefined ? parseFloat(lng) : null;
    if ((originLat === null || isNaN(originLat)) && req.serviceUser?.location?.coordinates) {
      [originLng, originLat] = req.serviceUser.location.coordinates;
    }

    const requests = await DoctorChamberRequest.find(query)
      .populate('doctorId', 'name mobile email isVerified isBlocked doctorDetails')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    let respondedIds = new Set();
    if (req.serviceUser) {
      const mine = await DoctorRequestResponse.find({ responderId: req.serviceUser._id }).select('requestId').lean();
      respondedIds = new Set(mine.map((m) => String(m.requestId)));
    }

    const maxRadius = radiusKm ? parseFloat(radiusKm) : null;
    const isAuth = Boolean(req.serviceUser || req.isAdmin);
    const results = requests
      .filter((r) => r.doctorId && !r.doctorId.isBlocked)
      .map((r) => {
        const [rLng, rLat] = r.location?.coordinates || [];
        const distanceKm =
          originLat !== null && !isNaN(originLat) && rLat !== undefined
            ? calculateDistanceKm(originLat, originLng, rLat, rLng)
            : null;
        return { ...publicView(r, isAuth), distanceKm, hasResponded: respondedIds.has(String(r._id)) };
      })
      .filter((r) => !(maxRadius && r.distanceKm !== null && r.distanceKm > maxRadius))
      .sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));

    res.json(results);
  } catch (error) {
    console.error('Doctor request feed error:', error);
    res.status(500).json({ message: 'Unable to load doctors looking for chambers.' });
  }
};

/** POST /api/services/doctor-requests/:id/respond (pharmacy owner / member offering a chamber) */
exports.respondToRequest = async (req, res) => {
  try {
    const request = await DoctorChamberRequest.findById(req.params.id);
    if (!request || request.status !== 'active' || !isPubliclyVisible(request)) {
      return res.status(404).json({ message: 'This chamber requirement is not available.' });
    }
    if (String(request.doctorId) === String(req.serviceUser._id)) {
      return res.status(400).json({ message: 'You cannot respond to your own requirement.' });
    }

    const responder = await ServiceUser.findById(req.serviceUser._id);
    const message = cleanText(req.body.message, 800);
    if (message.length < 10) return res.status(400).json({ message: 'Please write a short message (at least 10 characters).' });

    // Optionally attach one of the responder's own verified chamber listings
    let chamber = null;
    if (req.body.chamberPostId) {
      chamber = await DoctorCollaborationPost.findOne({ _id: req.body.chamberPostId, ownerId: responder._id });
      if (!chamber || !isPubliclyVisible(chamber)) {
        return res.status(400).json({ message: 'Please choose one of your verified chamber listings.' });
      }
    }

    const existing = await DoctorRequestResponse.findOne({ requestId: request._id, responderId: responder._id });
    if (existing) return res.status(409).json({ message: 'You have already offered a chamber for this requirement.' });

    const response = await DoctorRequestResponse.create({
      requestId: request._id,
      doctorId: request.doctorId,
      responderId: responder._id,
      chamberPostId: chamber?._id,
      pharmacyName: cleanText(req.body.pharmacyName, 120) || chamber?.clinicOrChamberName || chamber?.pharmacyName || responder.pharmacyDetails?.pharmacyName || responder.name,
      responderName: responder.name,
      responderMobile: responder.mobile,
      responderEmail: responder.email,
      message
    });
    await DoctorChamberRequest.updateOne({ _id: request._id }, { $inc: { responsesCount: 1 } });

    const doctor = await ServiceUser.findById(request.doctorId);
    if (doctor) {
      Notification.create({
        userId: doctor._id,
        title: 'New chamber offer',
        message: `${response.pharmacyName} offered a chamber for "${request.title}".`,
        type: 'collab_inquiry',
        link: '/services'
      }).catch(() => {});
      notifyDoctorOfChamberOffer({ doctor, request, response, chamber }).catch((err) => console.error('Chamber offer email error:', err));
    }

    res.status(201).json({ message: 'Your chamber offer was sent to the doctor.', response });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'You have already offered a chamber for this requirement.' });
    console.error('Respond to doctor request error:', error);
    res.status(500).json({ message: 'Unable to send your offer.' });
  }
};

/** GET /api/services/doctor-requests/:id/responses (owner doctor) */
exports.getResponses = async (req, res) => {
  try {
    const request = await DoctorChamberRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Chamber requirement not found.' });
    if (!req.isAdmin && String(request.doctorId) !== String(req.serviceUser._id)) {
      return res.status(403).json({ message: 'Only the doctor who posted this can view offers.' });
    }
    const responses = await DoctorRequestResponse.find({ requestId: request._id })
      .populate('chamberPostId', 'clinicOrChamberName pharmacyName preferredTimings collaborationTerms location images')
      .sort({ createdAt: -1 })
      .lean();
    res.json(responses);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load offers.' });
  }
};

/** PATCH /api/services/doctor-requests/responses/:responseId/status (owner doctor) */
exports.updateResponseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined', 'pending'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });
    const response = await DoctorRequestResponse.findById(req.params.responseId);
    if (!response) return res.status(404).json({ message: 'Offer not found.' });
    if (!req.isAdmin && String(response.doctorId) !== String(req.serviceUser._id)) {
      return res.status(403).json({ message: 'Not allowed.' });
    }
    response.status = status;
    await response.save();
    Notification.create({
      userId: response.responderId,
      title: status === 'accepted' ? 'Doctor accepted your chamber offer' : 'Chamber offer update',
      message: `Your chamber offer was ${status}.`,
      type: 'inquiry_status',
      link: '/services'
    }).catch(() => {});
    res.json({ message: `Offer marked as ${status}.`, response });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update the offer.' });
  }
};

/** GET /api/services/doctor-requests/my-offers (pharmacy: offers I have sent) */
exports.getMyOffers = async (req, res) => {
  try {
    const offers = await DoctorRequestResponse.find({ responderId: req.serviceUser._id })
      .populate('requestId', 'title specialization preferredTimings location status')
      .sort({ createdAt: -1 })
      .lean();
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load your offers.' });
  }
};

/** GET /api/services/admin/doctor-requests */
exports.getAdminRequests = async (req, res) => {
  try {
    const { search, moderation } = req.query;
    const query = {};
    if (typeof search === 'string' && search.trim()) {
      const rx = { $regex: escapeRegex(search.trim()), $options: 'i' };
      query.$or = [{ title: rx }, { specialization: rx }, { 'location.city': rx }];
    }
    if (moderation === 'pending' || moderation === 'rejected') query.moderationStatus = moderation;
    if (moderation === 'approved') query.moderationStatus = { $nin: ['pending', 'rejected'] };
    const requests = await DoctorChamberRequest.find(query)
      .populate('doctorId', 'name email mobile isVerified isBlocked doctorDetails')
      .sort({ createdAt: -1 })
      .lean();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load doctor chamber requirements.' });
  }
};
