/**
 * Calculate distance in kilometers between two geographic coordinate pairs using the Haversine formula.
 * @param {number} lat1 Latitude of first point
 * @param {number} lon1 Longitude of first point
 * @param {number} lat2 Latitude of second point
 * @param {number} lon2 Longitude of second point
 * @returns {number} Distance in kilometers (rounded to 1 decimal place)
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return null;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Validate and sanitize coordinates [longitude, latitude]
 */
function sanitizeCoordinates(coords) {
  if (!Array.isArray(coords) || coords.length !== 2) {
    return [77.1025, 28.7041]; // Default fallback
  }

  let lng = parseFloat(coords[0]);
  let lat = parseFloat(coords[1]);

  if (isNaN(lng) || lng < -180 || lng > 180) lng = 77.1025;
  if (isNaN(lat) || lat < -90 || lat > 90) lat = 28.7041;

  return [lng, lat];
}

module.exports = {
  calculateDistanceKm,
  sanitizeCoordinates
};
