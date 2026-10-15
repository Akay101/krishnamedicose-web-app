import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Navigation, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import servicesApi from '../../utils/servicesApi';

// Common Indian place names mapping to English
const KNOWN_PLACE_NAMES = {
  'गाज़ियाबाद': 'Ghaziabad',
  'गाजियाबाद': 'Ghaziabad',
  'सिकंदरपुर': 'Sikanderpur',
  'सिकन्दरपुर': 'Sikanderpur',
  'पसौंड़ा': 'Pasonda',
  'पसोंडा': 'Pasonda',
  'साहिबाबाद': 'Sahibabad',
  'इंदिरापुरम': 'Indirapuram',
  'वैशाली': 'Vaishali',
  'वसुंधरा': 'Vasundhara',
  'नोएडा': 'Noida',
  'ग्रेटर नोएडा': 'Greater Noida',
  'दिल्ली': 'Delhi',
  'नई दिल्ली': 'New Delhi',
  'गुरुग्राम': 'Gurugram',
  'गुड़गांव': 'Gurgaon',
  'फरीदाबाद': 'Faridabad',
  'मेरठ': 'Meerut',
  'हापुड़': 'Hapur',
  'मुरादाबाद': 'Moradabad',
  'बरेली': 'Bareilly',
  'अलीगढ़': 'Aligarh',
  'आगरा': 'Agra',
  'मथुरा': 'Mathura',
  'लखनऊ': 'Lucknow',
  'कानपुर': 'Kanpur',
  'वाराणसी': 'Varanasi',
  'प्रयागराज': 'Prayagraj',
  'इलाहाबाद': 'Prayagraj',
  'उत्तर प्रदेश': 'Uttar Pradesh',
  'हरियाणा': 'Haryana',
  'राजस्थान': 'Rajasthan',
  'पंजाब': 'Punjab',
  'उत्तराखंड': 'Uttarakhand',
  'मध्य प्रदेश': 'Madhya Pradesh',
  'बिहार': 'Bihar',
  'महाराष्ट्र': 'Maharashtra'
};

function transliterateDevanagari(input) {
  const charMap = {
    'अ': 'A', 'आ': 'Aa', 'इ': 'I', 'ई': 'Ee', 'उ': 'U', 'ऊ': 'Oo', 'ऋ': 'Ri',
    'ए': 'E', 'ऐ': 'Ai', 'ओ': 'O', 'औ': 'Au', 'अं': 'An', 'अः': 'Ah',
    'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n', 'ः': 'h',
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
    'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'क़': 'q', 'ख़': 'kh', 'ग़': 'gh', 'ज़': 'z', 'ड़': 'd', 'ढ़': 'dh', 'फ़': 'f'
  };

  const consonants = new Set([
    'क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ',
    'ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न',
    'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श',
    'ष', 'स', 'ह', 'क़', 'ख़', 'ग़', 'ज़', 'ड़', 'ढ़', 'फ़'
  ]);

  const matras = new Set(['ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै', 'ो', 'ौ', 'ं', 'ँ', 'ः']);

  let out = '';
  const len = input.length;
  for (let i = 0; i < len; i++) {
    const c = input[i];
    const next = input[i + 1] || '';
    const twoChars = c + next;

    if (consonants.has(twoChars)) {
      i++;
      const after = input[i + 1] || '';
      const mapped = charMap[twoChars] || '';
      if (after === '्') {
        out += mapped;
        i++;
      } else if (matras.has(after)) {
        out += mapped + (charMap[after] || '');
        i++;
      } else if (consonants.has(after) || consonants.has(after + (input[i + 2] || ''))) {
        out += mapped + 'a';
      } else {
        out += mapped;
      }
    } else if (consonants.has(c)) {
      const mapped = charMap[c] || '';
      if (next === '्') {
        out += mapped;
        i++;
      } else if (matras.has(next)) {
        out += mapped + (charMap[next] || '');
        i++;
      } else if (consonants.has(next) || consonants.has(next + (input[i + 2] || ''))) {
        out += mapped + 'a';
      } else {
        out += mapped;
      }
    } else if (charMap[c]) {
      out += charMap[c];
    } else {
      out += c;
    }
  }

  return out
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

function ensureEnglishText(str) {
  if (!str) return '';
  if (!/[\u0900-\u097F]/.test(str)) return str;

  let text = str;
  for (const [hi, en] of Object.entries(KNOWN_PLACE_NAMES)) {
    text = text.split(hi).join(en);
  }

  if (/[\u0900-\u097F]/.test(text)) {
    text = transliterateDevanagari(text);
  }

  return text.trim();
}

// Calculate distance in kilometers using the Haversine formula
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lon1 === undefined ||
    lat2 === undefined || lon2 === undefined ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
    return Infinity;
  }
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance for UI badge
function formatDistance(distKm, isHi) {
  if (distKm === undefined || distKm === null || isNaN(distKm) || !isFinite(distKm)) {
    return '';
  }
  if (distKm < 1) {
    const meters = Math.round(distKm * 1000);
    return isHi ? `${meters} मी.` : `${meters} m`;
  }
  if (distKm < 10) {
    return isHi ? `${distKm.toFixed(1)} किमी` : `${distKm.toFixed(1)} km`;
  }
  return isHi ? `${Math.round(distKm)} किमी` : `${Math.round(distKm)} km`;
}

// Retrieve stored or fallback coordinates for proximity anchoring
function getStoredCoordinates(valueCoords) {
  if (
    Array.isArray(valueCoords) &&
    valueCoords.length === 2 &&
    typeof valueCoords[0] === 'number' &&
    typeof valueCoords[1] === 'number' &&
    (valueCoords[0] !== 0 || valueCoords[1] !== 0)
  ) {
    return valueCoords;
  }

  try {
    const saved = localStorage.getItem('service_last_coords');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 2 && !isNaN(parsed[0]) && !isNaN(parsed[1])) {
        return parsed;
      }
    }
  } catch (err) {
    // Ignore storage parse error
  }

  try {
    const userRaw = localStorage.getItem('service_user');
    if (userRaw) {
      const user = JSON.parse(userRaw);
      const coords = user?.location?.coordinates;
      if (Array.isArray(coords) && coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0)) {
        return coords;
      }
    }
  } catch (err) {
    // Ignore storage parse error
  }

  return [77.1025, 28.7041]; // Default Delhi NCR anchor [lng, lat]
}

export default function LocationPicker({
  value = {},
  onChange,
  t = {},
  lang,
  showMapPreview = true,
  className = ''
}) {
  const currentLang = lang || (t && t.lang) || localStorage.getItem('services_lang') || 'en';
  const isHindi = currentLang === 'hi';

  const [refCoords, setRefCoords] = useState(() => getStoredCoordinates(value?.coordinates));
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [feedback, setFeedback] = useState('');
  const dropdownRef = useRef(null);

  const coordinates = value.coordinates && value.coordinates.length === 2
    ? value.coordinates
    : [77.1025, 28.7041]; // Default Delhi [lng, lat]

  const lng = coordinates[0];
  const lat = coordinates[1];

  // Sync refCoords if value.coordinates changes from outside
  useEffect(() => {
    if (
      Array.isArray(value?.coordinates) &&
      value.coordinates.length === 2 &&
      typeof value.coordinates[0] === 'number' &&
      typeof value.coordinates[1] === 'number' &&
      (value.coordinates[0] !== 0 || value.coordinates[1] !== 0)
    ) {
      setRefCoords(value.coordinates);
    }
  }, [value?.coordinates]);

  // Silently check if browser geolocation is already permitted
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const coords = [pos.coords.longitude, pos.coords.latitude];
                setRefCoords(coords);
                try {
                  localStorage.setItem('service_last_coords', JSON.stringify(coords));
                } catch (err) {}
              },
              () => {},
              { timeout: 5000, enableHighAccuracy: false }
            );
          }
        })
        .catch(() => {});
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced multi-source location search sorted closest-first
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const langParam = isHindi ? 'hi' : 'en';
        const [refLng, refLat] = Array.isArray(refCoords) && refCoords.length === 2
          ? refCoords
          : [77.1025, 28.7041];

        let loadedResults = [];

        // 1. Primary: Query production multi-source autocomplete backend
        try {
          const res = await servicesApi.get('/location/autocomplete', {
            params: {
              q: query.trim(),
              lat: refLat,
              lon: refLng,
              lang: langParam
            }
          });
          if (res.data?.success && Array.isArray(res.data.results) && res.data.results.length > 0) {
            loadedResults = res.data.results;
          }
        } catch (apiErr) {
          // Gracefully fallback to direct Nominatim if backend endpoint is unavailable
        }

        // 2. Fallback: Query Nominatim with viewbox if backend returned 0 results
        if (loadedResults.length === 0) {
          const delta = 2.5;
          const minLon = (refLng - delta).toFixed(4);
          const maxLat = (refLat + delta).toFixed(4);
          const maxLon = (refLng + delta).toFixed(4);
          const minLat = (refLat - delta).toFixed(4);

          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              query.trim()
            )}&addressdetails=1&countrycodes=in&limit=15&viewbox=${minLon},${maxLat},${maxLon},${minLat}&bounded=0&accept-language=${isHindi ? 'hi,en' : 'en'}`,
            { headers: { 'Accept-Language': isHindi ? 'hi,en' : 'en' } }
          );

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              loadedResults = data.map((item) => {
                const itemLat = parseFloat(item.lat);
                const itemLng = parseFloat(item.lon);
                const dist = calculateDistanceKm(refLat, refLng, itemLat, itemLng);
                const parts = (item.display_name || '').split(',');
                return {
                  mainText: parts[0]?.trim() || item.name || query,
                  secondaryText: parts.slice(1, 4).join(',').trim(),
                  fullAddress: item.display_name,
                  coordinates: [itemLng, itemLat],
                  lat: itemLat,
                  lon: itemLng,
                  distanceKm: dist,
                  address: item.address || {}
                };
              });

              loadedResults.sort((a, b) => {
                const distA = typeof a.distanceKm === 'number' ? a.distanceKm : Infinity;
                const distB = typeof b.distanceKm === 'number' ? b.distanceKm : Infinity;
                return distA - distB;
              });
            }
          }
        }

        setSuggestions(loadedResults);
        setShowDropdown(true);
      } catch (err) {
        console.error('Error fetching location suggestions:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isHindi, refCoords]);

  // Handle suggestion selection
  const handleSelectSuggestion = (item) => {
    const itemLat = parseFloat(item.lat);
    const itemLng = parseFloat(item.lon || (item.coordinates && item.coordinates[0]));

    if (!isNaN(itemLat) && !isNaN(itemLng)) {
      setRefCoords([itemLng, itemLat]);
      try {
        localStorage.setItem('service_last_coords', JSON.stringify([itemLng, itemLat]));
      } catch (err) {}
    }

    const addr = item.address || {};
    const cityRaw =
      item.city ||
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.county ||
      addr.district ||
      '';
    const stateRaw = item.state || addr.state || '';
    const pincode = item.pincode || addr.postcode || '';
    const streetRaw =
      item.mainText ||
      (item.display_name ? item.display_name.split(',').slice(0, 3).join(', ') : '');

    const city = isHindi ? cityRaw : ensureEnglishText(cityRaw);
    const state = isHindi ? stateRaw : ensureEnglishText(stateRaw);
    const street = isHindi ? streetRaw : ensureEnglishText(streetRaw);

    onChange({
      address: street || value.address || '',
      city: city || value.city || '',
      state: state || value.state || '',
      pincode: pincode || value.pincode || '',
      coordinates: [itemLng, itemLat]
    });

    setQuery('');
    setShowDropdown(false);
    setFeedback(`${city ? city + ', ' : ''}${state}`);
    setTimeout(() => setFeedback(''), 4000);
  };

  // Browser GPS auto-detection
  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      alert(
        isHindi
          ? 'ब्राउज़र में जियोलोकेशन समर्थित नहीं है।'
          : 'Geolocation is not supported by your browser.'
      );
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const curLat = pos.coords.latitude;
        const curLng = pos.coords.longitude;

        setRefCoords([curLng, curLat]);
        try {
          localStorage.setItem('service_last_coords', JSON.stringify([curLng, curLat]));
        } catch (err) {}

        try {
          let resolved = null;

          // Try backend reverse endpoint first
          try {
            const revRes = await servicesApi.get('/location/reverse', {
              params: { lat: curLat, lon: curLng, lang: isHindi ? 'hi' : 'en' }
            });
            if (revRes.data?.success) {
              resolved = revRes.data;
            }
          } catch (e) {}

          // Fallback to client-side reverse geocoding
          if (!resolved) {
            const langParam = isHindi ? 'hi,en' : 'en';
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${curLat}&lon=${curLng}&format=json&addressdetails=1&accept-language=${langParam}`,
              { headers: { 'Accept-Language': langParam } }
            );
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              resolved = {
                city: addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.district || '',
                state: addr.state || '',
                pincode: addr.postcode || '',
                address: data.display_name ? data.display_name.split(',').slice(0, 3).join(', ') : ''
              };
            }
          }

          if (resolved) {
            const city = isHindi ? resolved.city : ensureEnglishText(resolved.city);
            const state = isHindi ? resolved.state : ensureEnglishText(resolved.state);
            const fullAddr = isHindi ? resolved.address : ensureEnglishText(resolved.address);

            onChange({
              address: fullAddr || value.address || '',
              city: city || value.city || '',
              state: state || value.state || '',
              pincode: resolved.pincode || value.pincode || '',
              coordinates: [curLng, curLat]
            });

            setFeedback(
              isHindi
                ? `स्थान मिला: ${city ? city + ', ' : ''}${state}`
                : `Location detected: ${city ? city + ', ' : ''}${state}`
            );
          } else {
            onChange({
              ...value,
              coordinates: [curLng, curLat]
            });
            setFeedback(
              isHindi
                ? `निर्देशांक प्राप्त: ${curLat.toFixed(4)}, ${curLng.toFixed(4)}`
                : `Coordinates captured: ${curLat.toFixed(4)}, ${curLng.toFixed(4)}`
            );
          }
        } catch (e) {
          onChange({
            ...value,
            coordinates: [curLng, curLat]
          });
          setFeedback(
            isHindi
              ? `निर्देशांक प्राप्त: ${curLat.toFixed(4)}, ${curLng.toFixed(4)}`
              : `Coordinates captured: ${curLat.toFixed(4)}, ${curLng.toFixed(4)}`
          );
        } finally {
          setDetectingGps(false);
          setTimeout(() => setFeedback(''), 4000);
        }
      },
      (err) => {
        setDetectingGps(false);
        alert(
          isHindi
            ? 'वर्तमान स्थान प्राप्त नहीं हो सका। कृपया अपना क्षेत्र नाम टाइप करें।'
            : 'Could not access current location. Please type your area name.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Full-width Search Bar & Autocomplete Dropdown Container */}
      <div className="relative w-full" ref={dropdownRef}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              placeholder={
                t.searchLocation ||
                (isHindi
                  ? 'इमारत, मॉल, सेक्टर, क्षेत्र या शहर खोजें...'
                  : 'Search building, society, area, or landmark...')
              }
              className="w-full h-11 pl-11 pr-10 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/70 focus:bg-white transition-all shadow-sm"
              maxLength={120}
            />
            {loadingSuggestions && (
              <Loader2 className="w-4 h-4 text-teal-600 animate-spin absolute right-3.5 top-3.5" />
            )}
            {query && !loadingSuggestions && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleAutoDetect}
            disabled={detectingGps}
            className="h-11 px-4 sm:px-5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs sm:text-sm font-bold rounded-xl border border-teal-200 transition-colors flex items-center justify-center gap-2 flex-shrink-0 shadow-sm"
          >
            {detectingGps ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
                <span>{isHindi ? 'स्थान खोज रहे हैं...' : 'Detecting...'}</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-teal-700" />
                <span>{t.useGps || (isHindi ? 'जीपीएस उपयोग करें' : 'Use My GPS Location')}</span>
              </>
            )}
          </button>
        </div>

        {/* Full-Width Autocomplete Dropdown - Spans across the full modal width */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-80 overflow-y-auto divide-y divide-slate-100 ring-1 ring-black/5 animate-in fade-in duration-150">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 sticky top-0 z-10 backdrop-blur-sm">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-teal-600" />
                <span>{isHindi ? 'निकटतम स्थान पहले (सटीक परिणाम)' : 'Closest locations first (High accuracy)'}</span>
              </span>
              <span className="text-[10px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                {suggestions.length} {isHindi ? 'स्थान' : 'places'}
              </span>
            </div>

            {suggestions.map((item, idx) => {
              const mainText = isHindi ? item.mainText : ensureEnglishText(item.mainText);
              const secondaryText = isHindi ? item.secondaryText : ensureEnglishText(item.secondaryText);
              const distanceStr = formatDistance(item.distanceKm || item._distanceKm, isHindi);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left p-3.5 sm:p-4 hover:bg-teal-50/80 transition-all flex items-start justify-between gap-3 sm:gap-4 group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-teal-50 text-teal-700 rounded-xl group-hover:bg-teal-100 group-hover:scale-105 transition-all flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-teal-900 leading-snug">
                        {mainText}
                      </div>
                      {secondaryText && (
                        <div className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                          {secondaryText}
                        </div>
                      )}
                    </div>
                  </div>

                  {distanceStr && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80 flex-shrink-0 whitespace-nowrap self-start mt-0.5">
                      {distanceStr}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Empty search state */}
        {showDropdown && !loadingSuggestions && query.trim().length >= 2 && suggestions.length === 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-5 text-center text-xs text-slate-500">
            {isHindi
              ? 'कोई सटीक स्थान नहीं मिला। कृपया क्षेत्र, सेक्टर या शहर का नाम टाइप करें।'
              : 'No matching locations found. Try searching by area, sector, or city name.'}
          </div>
        )}
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-emerald-800 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="truncate">{feedback}</span>
        </div>
      )}

      {/* Manual Input Fields with Validation & Character Caps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-3">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {t.streetAddress || 'Address / Landmark'} *
          </label>
          <input
            type="text"
            required
            value={value.address || ''}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            placeholder={isHindi ? 'दुकान / मकान नं., बाजार, सेक्टर' : 'Shop / House No., Market, Sector'}
            className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {t.city || (isHindi ? 'शहर' : 'City')} *
          </label>
          <input
            type="text"
            required
            value={value.city || ''}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            placeholder={isHindi ? 'उदा. दिल्ली, गुरुग्राम' : 'e.g. Delhi, Gurgaon'}
            className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
            maxLength={50}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {t.state || (isHindi ? 'राज्य' : 'State')} *
          </label>
          <input
            type="text"
            required
            value={value.state || ''}
            onChange={(e) => onChange({ ...value, state: e.target.value })}
            placeholder={isHindi ? 'उदा. दिल्ली, हरियाणा' : 'e.g. Delhi, Haryana'}
            className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
            maxLength={50}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {t.pincode || (isHindi ? 'पिन कोड' : 'PIN Code')} *
          </label>
          <input
            type="text"
            required
            value={value.pincode || ''}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
              onChange({ ...value, pincode: cleaned });
            }}
            placeholder={isHindi ? '6-अंकीय पिन' : '6-digit PIN'}
            className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
            maxLength={6}
          />
        </div>
      </div>

      {/* Interactive Map Visualizer with live pin coordinates */}
      {showMapPreview && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
          <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>{isHindi ? 'मानचित्र निर्देशांक:' : 'Map Coordinates:'} {lat.toFixed(4)}, {lng.toFixed(4)}</span>
            </div>
            <span className="text-[10px] text-slate-400">OpenStreetMap</span>
          </div>

          <div className="relative h-44 w-full bg-slate-200">
            <iframe
              title="Location Map"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.015}%2C${lng + 0.02}%2C${lat + 0.015}&layer=mapnik&marker=${lat}%2C${lng}`}
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
