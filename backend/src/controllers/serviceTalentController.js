const { escapeRegex } = require("../utils/security");

// Members' precise home/work coordinates and street address are never published;
// the directory only needs city-level location (distance is computed server-side).
const coarseLocation = (loc, isAuth) =>
  loc
    ? {
        city: loc.city,
        state: loc.state,
        pincode: isAuth ? loc.pincode : undefined,
        address: isAuth ? loc.address : undefined,
        type: 'Point',
        coordinates: Array.isArray(loc.coordinates) ? loc.coordinates.map((c) => Math.round(c * 100) / 100) : undefined
      }
    : undefined;
const ServiceUser = require('../models/ServiceUser');
const { calculateDistanceKm } = require('../utils/geoUtils');

/**
 * Get Open-to-Work Pharmacists
 * GET /api/services/talent/pharmacists
 */
exports.getOpenPharmacists = async (req, res) => {
  try {
    const {
      search,
      qualification,
      minExperience,
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

    const query = {
      role: 'job_seeker_pharmacist',
      isOpenToWork: true,
      isBlocked: false
    };

    if (search) {
      query.$or = [
        { name: { $regex: escapeRegex(search), $options: 'i' } },
        { 'location.city': { $regex: escapeRegex(search), $options: 'i' } },
        { 'pharmacistDetails.skills': { $regex: escapeRegex(search), $options: 'i' } }
      ];
    }

    if (qualification && qualification !== 'All') {
      query['pharmacistDetails.qualification'] = qualification;
    }

    if (minExperience && !isNaN(minExperience)) {
      query['pharmacistDetails.experienceYears'] = { $gte: Number(minExperience) };
    }

    const pharmacists = await ServiceUser.find(query)
      .select('-password')
      .lean();

    const withDistance = pharmacists.map((p) => {
      let distanceKm = null;
      if (
        userLat !== null &&
        userLng !== null &&
        p.location?.coordinates &&
        p.location.coordinates.length === 2
      ) {
        distanceKm = calculateDistanceKm(
          userLat,
          userLng,
          p.location.coordinates[1],
          p.location.coordinates[0]
        );
      }
      return { ...p, distanceKm };
    });

    const maxRadius = radiusKm ? parseFloat(radiusKm) : null;
    const results = withDistance.filter((p) => {
      if (maxRadius && p.distanceKm !== null && p.distanceKm > maxRadius) {
        return false;
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
    const sanitized = results.map((p) => ({
      ...p,
      mobile: isAuth ? p.mobile : null,
      email: isAuth ? p.email : null,
      location: coarseLocation(p.location, isAuth),
      // Never expose identity documents or registration numbers in the public directory
      pharmacyDetails: undefined,
      pharmacistDetails: p.pharmacistDetails ? { ...p.pharmacistDetails, licenseImage: undefined, licenseNumber: undefined, resumeUrl: isAuth ? p.pharmacistDetails.resumeUrl : undefined } : undefined,
      doctorDetails: p.doctorDetails ? { ...p.doctorDetails, medicalRegistrationNumber: undefined } : undefined,
      isContactLocked: !isAuth
    }));

    res.json(sanitized);
  } catch (error) {
    console.error('Get Pharmacists Error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Open-to-Collaborate Doctors
 * GET /api/services/talent/doctors
 */
exports.getOpenDoctors = async (req, res) => {
  try {
    const {
      search,
      specialization,
      minExperience,
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

    const query = {
      role: 'doctor',
      isOpenToCollaborate: true,
      isBlocked: false
    };

    if (search) {
      query.$or = [
        { name: { $regex: escapeRegex(search), $options: 'i' } },
        { 'doctorDetails.specialization': { $regex: escapeRegex(search), $options: 'i' } },
        { 'location.city': { $regex: escapeRegex(search), $options: 'i' } }
      ];
    }

    if (specialization && specialization !== 'All') {
      query['doctorDetails.specialization'] = { $regex: escapeRegex(specialization), $options: 'i' };
    }

    if (minExperience && !isNaN(minExperience)) {
      query['doctorDetails.experienceYears'] = { $gte: Number(minExperience) };
    }

    const doctors = await ServiceUser.find(query)
      .select('-password')
      .lean();

    const withDistance = doctors.map((d) => {
      let distanceKm = null;
      if (
        userLat !== null &&
        userLng !== null &&
        d.location?.coordinates &&
        d.location.coordinates.length === 2
      ) {
        distanceKm = calculateDistanceKm(
          userLat,
          userLng,
          d.location.coordinates[1],
          d.location.coordinates[0]
        );
      }
      return { ...d, distanceKm };
    });

    const maxRadius = radiusKm ? parseFloat(radiusKm) : null;
    const results = withDistance.filter((d) => {
      if (maxRadius && d.distanceKm !== null && d.distanceKm > maxRadius) {
        return false;
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
    const sanitized = results.map((d) => ({
      ...d,
      mobile: isAuth ? d.mobile : null,
      email: isAuth ? d.email : null,
      location: coarseLocation(d.location, isAuth),
      pharmacyDetails: undefined,
      pharmacistDetails: undefined,
      isContactLocked: !isAuth
    }));

    res.json(sanitized);
  } catch (error) {
    console.error('Get Doctors Error:', error);
    res.status(500).json({ message: error.message });
  }
};
