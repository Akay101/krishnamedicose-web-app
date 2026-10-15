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
        { name: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'pharmacistDetails.skills': { $regex: search, $options: 'i' } }
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
        { name: { $regex: search, $options: 'i' } },
        { 'doctorDetails.specialization': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    if (specialization && specialization !== 'All') {
      query['doctorDetails.specialization'] = { $regex: specialization, $options: 'i' };
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
      isContactLocked: !isAuth
    }));

    res.json(sanitized);
  } catch (error) {
    console.error('Get Doctors Error:', error);
    res.status(500).json({ message: error.message });
  }
};
