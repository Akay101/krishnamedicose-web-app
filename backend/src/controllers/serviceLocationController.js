const { calculateDistanceKm, sanitizeCoordinates } = require('../utils/geoUtils');

// Fast in-memory cache with 15-minute TTL to keep autocomplete ultra fast (<10ms)
const cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 1000;

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { timestamp: Date.now(), data });
}

// Sub-phrase locality cache for Nominatim fallback
const localityCache = new Map();

async function geocodeLocality(phrase) {
  const normalized = phrase.toLowerCase().trim();
  if (localityCache.has(normalized)) {
    return localityCache.get(normalized);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      phrase
    )}&addressdetails=1&countrycodes=in&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KmLandingPage-Production/2.0' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localityCache.set(normalized, data[0]);
        return data[0];
      }
    }
  } catch (err) {
    // Ignore error
  }

  localityCache.set(normalized, null);
  return null;
}

function formatTitleCase(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
}

// Cache for Google place details to avoid repeated billing queries
const placeDetailsCache = new Map();

async function fetchGooglePlaceDetails(placeId, apiKey) {
  if (placeDetailsCache.has(placeId)) {
    return placeDetailsCache.get(placeId);
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    const res = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents'
      }
    });

    if (res.ok) {
      const data = await res.json();
      placeDetailsCache.set(placeId, data);
      return data;
    }
  } catch (err) {
    console.error('Error fetching Google Place details:', err.message);
  }

  return null;
}

/**
 * Multi-source location autocomplete endpoint.
 * Supports official Google Places API (New) with fallback to multi-source engine.
 */
exports.autocomplete = async (req, res) => {
  try {
    const query = (req.query.q || req.query.query || '').trim();
    if (!query || query.length < 2) {
      return res.json({ success: true, results: [] });
    }

    const refLat = parseFloat(req.query.lat) || 28.7041; // Default Delhi NCR
    const refLon = parseFloat(req.query.lon) || 77.1025;
    const lang = req.query.lang === 'hi' ? 'hi' : 'en';

    const cacheKey = `${query.toLowerCase()}_${refLat.toFixed(2)}_${refLon.toFixed(2)}_${lang}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ success: true, results: cached, fromCache: true });
    }

    const results = [];
    const seenCoordKeys = new Set();
    const seenTitleKeys = new Set();

    // 1. Primary: Official Google Places API (New v1) if API key is present
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      try {
        const placesUrl = 'https://places.googleapis.com/v1/places:autocomplete';
        const requestBody = {
          input: query,
          includedRegionCodes: ['in'],
          languageCode: lang,
          locationBias: {
            circle: {
              center: {
                latitude: refLat,
                longitude: refLon
              },
              radius: 50000.0
            }
          }
        };

        const gRes = await fetch(placesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': googleApiKey
          },
          body: JSON.stringify(requestBody)
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          if (Array.isArray(gData.suggestions) && gData.suggestions.length > 0) {
            // Fetch details for top predictions in parallel
            const detailPromises = gData.suggestions.slice(0, 8).map(async (s) => {
              const pred = s.placePrediction;
              if (!pred || !pred.placeId) return null;

              const details = await fetchGooglePlaceDetails(pred.placeId, googleApiKey);
              if (!details || !details.location) return null;

              const itemLat = details.location.latitude;
              const itemLon = details.location.longitude;
              const distanceKm = calculateDistanceKm(refLat, refLon, itemLat, itemLon);

              // Parse address components
              let city = '';
              let state = '';
              let pincode = '';

              if (Array.isArray(details.addressComponents)) {
                for (const comp of details.addressComponents) {
                  const types = comp.types || [];
                  if (types.includes('locality')) city = comp.longText || comp.shortText || '';
                  else if (!city && types.includes('sublocality_level_1')) city = comp.longText || '';
                  if (types.includes('administrative_area_level_1')) state = comp.longText || '';
                  if (types.includes('postal_code')) pincode = comp.longText || '';
                }
              }

              const mainText =
                pred.structuredFormat?.mainText?.text ||
                details.displayName?.text ||
                pred.text?.text;

              const secondaryText =
                pred.structuredFormat?.secondaryText?.text ||
                details.formattedAddress ||
                '';

              return {
                mainText,
                secondaryText,
                fullAddress: details.formattedAddress || pred.text?.text,
                lat: itemLat,
                lon: itemLon,
                coordinates: [itemLon, itemLat],
                city,
                state,
                pincode,
                distanceKm,
                source: 'google_places_official'
              };
            });

            const resolvedGooglePlaces = (await Promise.all(detailPromises)).filter(Boolean);
            for (const item of resolvedGooglePlaces) {
              const coordKey = `${item.lat.toFixed(3)},${item.lon.toFixed(3)}`;
              if (!seenCoordKeys.has(coordKey)) {
                seenCoordKeys.add(coordKey);
                seenTitleKeys.add(item.mainText.toLowerCase());
                results.push(item);
              }
            }
          }
        } else {
          const errBody = await gRes.text();
          console.error('Places API (New) returned non-ok status:', gRes.status, errBody);
        }
      } catch (gErr) {
        console.error('Google Places API (New) error, using fallback:', gErr.message);
      }
    }

    // 2. Secondary: Nominatim OpenStreetMap with proximity viewbox (if needed or fallback)
    if (results.length < 5) {
      try {
        const delta = 2.5;
        const langParam = lang === 'hi' ? 'hi,en' : 'en';
        const nUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&countrycodes=in&limit=10&viewbox=${(refLon - delta).toFixed(4)},${(
          refLat + delta
        ).toFixed(4)},${(refLon + delta).toFixed(4)},${(refLat - delta).toFixed(4)}&bounded=0&accept-language=${langParam}`;

        const nRes = await fetch(nUrl, {
          headers: { 'User-Agent': 'KmLandingPage-Production/2.0' }
        });

        if (nRes.ok) {
          const nData = await nRes.json();
          if (Array.isArray(nData)) {
            for (const item of nData) {
              const itemLat = parseFloat(item.lat);
              const itemLon = parseFloat(item.lon);
              const coordKey = `${itemLat.toFixed(3)},${itemLon.toFixed(3)}`;

              if (!seenCoordKeys.has(coordKey)) {
                seenCoordKeys.add(coordKey);
                const parts = (item.display_name || '').split(',');
                const mainText = parts[0]?.trim() || item.name || query;
                const secondaryText = parts.slice(1, 4).join(',').trim();
                const distanceKm = calculateDistanceKm(refLat, refLon, itemLat, itemLon);

                seenTitleKeys.add(mainText.toLowerCase());

                const addr = item.address || {};
                const city = addr.city || addr.town || addr.village || addr.suburb || addr.district || '';
                const state = addr.state || '';
                const pincode = addr.postcode || '';

                results.push({
                  mainText,
                  secondaryText,
                  fullAddress: item.display_name,
                  lat: itemLat,
                  lon: itemLon,
                  coordinates: [itemLon, itemLat],
                  city,
                  state,
                  pincode,
                  distanceKm,
                  source: 'osm'
                });
              }
            }
          }
        }
      } catch (nErr) {
        console.error('Nominatim query error:', nErr.message);
      }
    }

    // 3. Fallback: Google Suggest queries for unindexed buildings/societies
    if (results.length < 3) {
      try {
        const gUrl = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;
        const gRes = await fetch(gUrl);
        if (gRes.ok) {
          const gData = await gRes.json();
          const rawSuggestions = gData[1] || [];

          const clean = rawSuggestions
            .filter((s) => {
              const l = s.toLowerCase();
              return !['rent', 'review', 'photo', 'price', 'salary', 'contact', 'phone', 'job', 'timing'].some(
                (w) => l.includes(w)
              );
            })
            .slice(0, 5);

          for (const sugg of clean) {
            const suggLower = sugg.toLowerCase();
            if (seenTitleKeys.has(suggLower)) continue;

            let geocoded = await geocodeLocality(sugg);
            let buildingName = formatTitleCase(sugg);
            let localityName = '';

            if (!geocoded) {
              const words = sugg.split(' ');
              for (let start = 1; start < words.length - 1; start++) {
                const subphrase = words.slice(start).join(' ');
                geocoded = await geocodeLocality(subphrase);
                if (geocoded) {
                  buildingName = formatTitleCase(words.slice(0, start).join(' '));
                  localityName = formatTitleCase(subphrase);
                  break;
                }
              }
            }

            if (geocoded) {
              const itemLat = parseFloat(geocoded.lat);
              const itemLon = parseFloat(geocoded.lon);
              const coordKey = `${itemLat.toFixed(3)},${itemLon.toFixed(3)}`;

              const titleKey = `${buildingName.toLowerCase()} ${localityName.toLowerCase()}`.trim();
              if (!seenTitleKeys.has(titleKey) && !seenCoordKeys.has(coordKey)) {
                seenTitleKeys.add(titleKey);
                seenCoordKeys.add(coordKey);

                const addr = geocoded.address || {};
                const city = addr.city || addr.town || addr.village || addr.suburb || addr.district || '';
                const state = addr.state || '';
                const pincode = addr.postcode || '';

                const geoParts = (geocoded.display_name || '').split(',');
                const cleanSecondary = geoParts.slice(0, 4).join(',').trim();

                const finalMain = localityName
                  ? `${buildingName}, ${localityName}`
                  : buildingName;

                const distanceKm = calculateDistanceKm(refLat, refLon, itemLat, itemLon);

                results.push({
                  mainText: finalMain,
                  secondaryText: cleanSecondary,
                  fullAddress: `${finalMain}, ${cleanSecondary}`,
                  lat: itemLat,
                  lon: itemLon,
                  coordinates: [itemLon, itemLat],
                  city,
                  state,
                  pincode,
                  distanceKm,
                  source: 'google_enhanced'
                });
              }
            }
          }
        }
      } catch (gSuggErr) {
        console.error('Google Suggest error:', gSuggErr.message);
      }
    }

    // Sort ascending by distance (closest first)
    results.sort((a, b) => {
      const distA = typeof a.distanceKm === 'number' ? a.distanceKm : Infinity;
      const distB = typeof b.distanceKm === 'number' ? b.distanceKm : Infinity;
      return distA - distB;
    });

    setCached(cacheKey, results);

    return res.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Autocomplete controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process location autocomplete.',
      results: []
    });
  }
};

/**
 * Reverse geocode coordinates to structured address
 * Uses Google Geocoding API if configured, with OpenStreetMap fallback
 */
exports.reverseGeocode = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const lang = req.query.lang === 'hi' ? 'hi' : 'en';

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates provided.' });
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

    // 1. Try Google Geocoding API
    if (googleApiKey) {
      try {
        const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googleApiKey}&language=${lang}`;
        const gRes = await fetch(gUrl);
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.status === 'OK' && Array.isArray(gData.results) && gData.results.length > 0) {
            const first = gData.results[0];
            let city = '';
            let state = '';
            let pincode = '';

            for (const comp of first.address_components || []) {
              const types = comp.types || [];
              if (types.includes('locality')) city = comp.long_name || comp.short_name;
              else if (!city && types.includes('sublocality_level_1')) city = comp.long_name;
              if (types.includes('administrative_area_level_1')) state = comp.long_name;
              if (types.includes('postal_code')) pincode = comp.long_name;
            }

            return res.json({
              success: true,
              address: first.formatted_address,
              city,
              state,
              pincode,
              formattedAddress: first.formatted_address,
              coordinates: [lon, lat],
              source: 'google_geocoding'
            });
          }
        }
      } catch (gErr) {
        console.error('Google Geocoding error, falling back to OSM:', gErr.message);
      }
    }

    // 2. OpenStreetMap fallback
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=${
      lang === 'hi' ? 'hi,en' : 'en'
    }`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'KmLandingPage-Production/2.0' }
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, message: 'Reverse geocode service unreachable.' });
    }

    const data = await response.json();
    const addr = data.address || {};

    const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.district || '';
    const state = addr.state || '';
    const pincode = addr.postcode || '';
    const street = data.display_name ? data.display_name.split(',').slice(0, 3).join(', ') : '';

    return res.json({
      success: true,
      address: street,
      city,
      state,
      pincode,
      formattedAddress: data.display_name,
      coordinates: [lon, lat],
      source: 'osm'
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reverse geocode coordinates.' });
  }
};
