import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Navigation, Loader2, CheckCircle2, X } from 'lucide-react';
import servicesApi from '../../utils/servicesApi';

// Instant local fallback dataset for top Indian cities, commercial hubs, and pharmacy centres
const POPULAR_INDIAN_LOCALITIES = [
  { mainText: 'Shalimar Bagh', secondaryText: 'North West Delhi, Delhi', city: 'Delhi', state: 'Delhi', pincode: '110088', coordinates: [77.1585, 28.7166] },
  { mainText: 'Shalimar Garden', secondaryText: 'Sahibabad, Ghaziabad, Uttar Pradesh', city: 'Ghaziabad', state: 'Uttar Pradesh', pincode: '201005', coordinates: [77.3400, 28.6920] },
  { mainText: 'Connaught Place', secondaryText: 'Central Delhi, New Delhi, Delhi', city: 'New Delhi', state: 'Delhi', pincode: '110001', coordinates: [77.2167, 28.6315] },
  { mainText: 'Lajpat Nagar', secondaryText: 'South Delhi, New Delhi, Delhi', city: 'New Delhi', state: 'Delhi', pincode: '110024', coordinates: [77.2433, 28.5700] },
  { mainText: 'Karol Bagh', secondaryText: 'Central Delhi, Delhi', city: 'Delhi', state: 'Delhi', pincode: '110005', coordinates: [77.1906, 28.6514] },
  { mainText: 'Rohini', secondaryText: 'North West Delhi, Delhi', city: 'Delhi', state: 'Delhi', pincode: '110085', coordinates: [77.1126, 28.7180] },
  { mainText: 'Dwarka', secondaryText: 'South West Delhi, Delhi', city: 'Delhi', state: 'Delhi', pincode: '110075', coordinates: [77.0460, 28.5921] },
  { mainText: 'Sector 18 Noida', secondaryText: 'Gautam Buddha Nagar, Uttar Pradesh', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301', coordinates: [77.3240, 28.5708] },
  { mainText: 'Sector 62 Noida', secondaryText: 'Gautam Buddha Nagar, Uttar Pradesh', city: 'Noida', state: 'Uttar Pradesh', pincode: '201309', coordinates: [77.3649, 28.6256] },
  { mainText: 'Indirapuram', secondaryText: 'Ghaziabad, Uttar Pradesh', city: 'Ghaziabad', state: 'Uttar Pradesh', pincode: '201014', coordinates: [77.3734, 28.6415] },
  { mainText: 'Vaishali', secondaryText: 'Ghaziabad, Uttar Pradesh', city: 'Ghaziabad', state: 'Uttar Pradesh', pincode: '201010', coordinates: [77.3392, 28.6476] },
  { mainText: 'Cyber City', secondaryText: 'DLF Phase 2, Gurugram, Haryana', city: 'Gurugram', state: 'Haryana', pincode: '122002', coordinates: [77.0878, 28.4950] },
  { mainText: 'Bandra West', secondaryText: 'Mumbai Suburban, Maharashtra', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', coordinates: [72.8333, 19.0596] },
  { mainText: 'Andheri East', secondaryText: 'Mumbai Suburban, Maharashtra', city: 'Mumbai', state: 'Maharashtra', pincode: '400069', coordinates: [72.8697, 19.1136] },
  { mainText: 'Dadar', secondaryText: 'Mumbai, Maharashtra', city: 'Mumbai', state: 'Maharashtra', pincode: '400028', coordinates: [72.8427, 19.0178] },
  { mainText: 'Koramangala', secondaryText: 'Bengaluru Urban, Karnataka', city: 'Bengaluru', state: 'Karnataka', pincode: '560034', coordinates: [77.6245, 12.9352] },
  { mainText: 'Indiranagar', secondaryText: 'Bengaluru Urban, Karnataka', city: 'Bengaluru', state: 'Karnataka', pincode: '560038', coordinates: [77.6412, 12.9719] },
  { mainText: 'Whitefield', secondaryText: 'Bengaluru, Karnataka', city: 'Bengaluru', state: 'Karnataka', pincode: '560066', coordinates: [77.7499, 12.9698] },
  { mainText: 'Hitec City', secondaryText: 'Madhapur, Hyderabad, Telangana', city: 'Hyderabad', state: 'Telangana', pincode: '500081', coordinates: [78.3728, 17.4435] },
  { mainText: 'Banjara Hills', secondaryText: 'Hyderabad, Telangana', city: 'Hyderabad', state: 'Telangana', pincode: '500034', coordinates: [78.4482, 17.4156] },
  { mainText: 'Park Street', secondaryText: 'Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal', pincode: '700016', coordinates: [88.3527, 22.5519] },
  { mainText: 'Salt Lake City', secondaryText: 'Sector 1, Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal', pincode: '700064', coordinates: [88.4143, 22.5867] },
  { mainText: 'T Nagar', secondaryText: 'Chennai, Tamil Nadu', city: 'Chennai', state: 'Tamil Nadu', pincode: '600017', coordinates: [80.2337, 13.0418] },
  { mainText: 'Anna Nagar', secondaryText: 'Chennai, Tamil Nadu', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040', coordinates: [80.2090, 13.0850] },
  { mainText: 'Kothrud', secondaryText: 'Pune, Maharashtra', city: 'Pune', state: 'Maharashtra', pincode: '411038', coordinates: [73.8052, 18.5074] },
  { mainText: 'Hinjawadi', secondaryText: 'Pune, Maharashtra', city: 'Pune', state: 'Maharashtra', pincode: '411057', coordinates: [73.7380, 18.5913] },
  { mainText: 'Navrangpura', secondaryText: 'Ahmedabad, Gujarat', city: 'Ahmedabad', state: 'Gujarat', pincode: '380009', coordinates: [72.5567, 23.0338] },
  { mainText: 'Hazratganj', secondaryText: 'Lucknow, Uttar Pradesh', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', coordinates: [80.9462, 26.8467] },
  { mainText: 'Gomti Nagar', secondaryText: 'Lucknow, Uttar Pradesh', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226010', coordinates: [80.9992, 26.8530] },
  { mainText: 'Civil Lines', secondaryText: 'Jaipur, Rajasthan', city: 'Jaipur', state: 'Rajasthan', pincode: '302006', coordinates: [75.7873, 26.9056] },
  { mainText: 'Vaishali Nagar', secondaryText: 'Jaipur, Rajasthan', city: 'Jaipur', state: 'Rajasthan', pincode: '302021', coordinates: [75.7431, 26.9157] },
  { mainText: 'Sector 17', secondaryText: 'Chandigarh', city: 'Chandigarh', state: 'Chandigarh', pincode: '160017', coordinates: [76.7794, 30.7415] },
  { mainText: 'Vijay Nagar', secondaryText: 'Indore, Madhya Pradesh', city: 'Indore', state: 'Madhya Pradesh', pincode: '452010', coordinates: [75.8947, 22.7533] },
  { mainText: 'Boring Road', secondaryText: 'Patna, Bihar', city: 'Patna', state: 'Bihar', pincode: '800001', coordinates: [85.1235, 25.6171] },
  { mainText: 'Alkapuri', secondaryText: 'Vadodara, Gujarat', city: 'Vadodara', state: 'Gujarat', pincode: '390007', coordinates: [73.1706, 22.3129] }
];

export default function SingleAddressAutocomplete({
  value = '',
  onChange,
  allowGps = false,
  placeholder = 'Search address or location...',
  label = 'Address & Location',
  required = true,
  className = '',
  helperText = ''
}) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [feedback, setFeedback] = useState('');
  const dropdownRef = useRef(null);
  const isTypingRef = useRef(false);

  // Sync internal query when value prop changes externally (e.g. form reset or pre-population)
  useEffect(() => {
    if (!isTypingRef.current) {
      setQuery(value || '');
    }
  }, [value]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Debounced search autocomplete
  useEffect(() => {
    if (!isTypingRef.current) {
      return;
    }

    const cleanQuery = (query || '').trim();
    if (cleanQuery.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // 0. Instant local matches while network queries resolve
    const qLower = cleanQuery.toLowerCase();
    const instantLocalMatches = POPULAR_INDIAN_LOCALITIES.filter((item) => {
      return (
        item.mainText.toLowerCase().includes(qLower) ||
        item.secondaryText.toLowerCase().includes(qLower) ||
        item.city.toLowerCase().includes(qLower)
      );
    });

    if (instantLocalMatches.length > 0) {
      setSuggestions(instantLocalMatches);
      setShowDropdown(true);
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        let loadedResults = [];

        // 1. Primary: Call backend location autocomplete endpoint
        try {
          const res = await servicesApi.get('/location/autocomplete', {
            params: {
              q: cleanQuery,
              lang: 'en'
            }
          });
          if (res.data?.success && Array.isArray(res.data.results) && res.data.results.length > 0) {
            loadedResults = res.data.results;
          }
        } catch (apiErr) {
          console.warn('Backend autocomplete endpoint note:', apiErr?.message);
        }

        // 2. Secondary: Direct Google Places API (New) if key available
        if (loadedResults.length === 0) {
          const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          if (googleApiKey) {
            try {
              const gRes = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Goog-Api-Key': googleApiKey
                },
                body: JSON.stringify({
                  input: cleanQuery,
                  includedRegionCodes: ['in'],
                  languageCode: 'en'
                })
              });
              if (gRes.ok) {
                const gData = await gRes.json();
                if (Array.isArray(gData.suggestions) && gData.suggestions.length > 0) {
                  loadedResults = gData.suggestions.map((s) => {
                    const p = s.placePrediction;
                    const mainText = p?.structuredFormat?.mainText?.text || p?.text?.text || cleanQuery;
                    const secondaryText = p?.structuredFormat?.secondaryText?.text || '';
                    return {
                      mainText,
                      secondaryText,
                      fullAddress: p?.text?.text || `${mainText}${secondaryText ? ', ' + secondaryText : ''}`,
                      coordinates: [77.1025, 28.7041],
                      city: secondaryText.split(',')[0]?.trim() || '',
                      state: '',
                      pincode: ''
                    };
                  });
                }
              }
            } catch (gErr) {
              console.warn('Direct Google Places request note:', gErr?.message);
            }
          }
        }

        // 3. Tertiary: OpenStreetMap Nominatim fallback
        if (loadedResults.length === 0) {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                cleanQuery
              )}&addressdetails=1&countrycodes=in&limit=10&accept-language=en`
            );

            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && data.length > 0) {
                loadedResults = data.map((item) => {
                  const itemLat = parseFloat(item.lat);
                  const itemLng = parseFloat(item.lon);
                  const parts = (item.display_name || '').split(',');
                  const addr = item.address || {};
                  const city = (addr.city || addr.town || addr.village || addr.suburb || addr.district || '').trim();
                  const state = (addr.state || '').trim();
                  const pincode = (addr.postcode || '').trim();
                  return {
                    mainText: parts[0]?.trim() || item.name || cleanQuery,
                    secondaryText: parts.slice(1, 4).join(',').trim(),
                    fullAddress: item.display_name,
                    coordinates: [itemLng, itemLat],
                    lat: itemLat,
                    lon: itemLng,
                    city,
                    state,
                    pincode,
                    address: addr
                  };
                });
              }
            }
          } catch (nErr) {
            console.warn('Nominatim fallback note:', nErr?.message);
          }
        }

        // Combine network results with instant local matches, avoiding duplicates
        const combined = [...loadedResults];
        const seen = new Set(combined.map((c) => (c.mainText || '').toLowerCase()));
        for (const loc of instantLocalMatches) {
          if (!seen.has(loc.mainText.toLowerCase())) {
            seen.add(loc.mainText.toLowerCase());
            combined.push(loc);
          }
        }

        setSuggestions(combined);
        setShowDropdown(combined.length > 0);
      } catch (err) {
        console.error('Error fetching location suggestions:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle selection of a suggested location
  const handleSelectSuggestion = (item) => {
    isTypingRef.current = false;
    const itemLat = parseFloat(item.lat || (item.coordinates && item.coordinates[1]) || 0);
    const itemLng = parseFloat(item.lon || (item.coordinates && item.coordinates[0]) || 0);

    const addr = item.address || {};
    let city = (
      item.city ||
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.district ||
      ''
    ).trim();

    let state = (item.state || addr.state || '').trim();
    const pincode = (item.pincode || addr.postcode || '').trim();

    // Extract fallback city/state from secondaryText if empty
    if (!city || !state) {
      const parts = (item.secondaryText || item.fullAddress || '').split(',').map((p) => p.trim());
      if (parts.length >= 1 && !city) city = parts[0];
      if (parts.length >= 2 && !state) state = parts[parts.length - 1];
    }

    // Construct clean single address string
    let formattedAddress = item.mainText || '';
    if (item.secondaryText) {
      formattedAddress = `${formattedAddress}, ${item.secondaryText}`;
    } else if (item.fullAddress) {
      formattedAddress = item.fullAddress;
    }

    // Clean up excessive whitespace
    formattedAddress = formattedAddress.replace(/\s+,/g, ',').replace(/,+/g, ',').trim();

    setQuery(formattedAddress);
    setShowDropdown(false);
    setSuggestions([]);

    setFeedback(city && state ? `${city}, ${state}` : 'Location selected');
    setTimeout(() => setFeedback(''), 4000);

    if (onChange) {
      onChange({
        address: formattedAddress,
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        coordinates: [itemLng, itemLat]
      });
    }
  };

  // Browser GPS auto-detection (for Distributor self-registration only)
  const handleGpsDetect = () => {
    isTypingRef.current = false;
    if (!navigator.geolocation) {
      setFeedback('Geolocation is not supported by your browser.');
      setTimeout(() => setFeedback(''), 4000);
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const curLat = pos.coords.latitude;
        const curLng = pos.coords.longitude;

        try {
          // Reverse geocode via Nominatim
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${curLat}&lon=${curLng}&addressdetails=1&accept-language=en`
          );

          if (revRes.ok) {
            const revData = await revRes.json();
            const addr = revData.address || {};
            const city = (addr.city || addr.town || addr.village || addr.suburb || addr.district || '').trim();
            const state = (addr.state || '').trim();
            const pincode = (addr.postcode || '').trim();
            const road = (addr.road || addr.suburb || addr.neighbourhood || '').trim();

            const constructed = [road, city, state, pincode].filter(Boolean).join(', ') || revData.display_name || `${curLat.toFixed(4)}, ${curLng.toFixed(4)}`;

            setQuery(constructed);
            setFeedback(`GPS detected: ${city ? city + ', ' : ''}${state}`);

            if (onChange) {
              onChange({
                address: constructed,
                city,
                state,
                pincode,
                coordinates: [curLng, curLat]
              });
            }
          } else {
            const fallbackAddr = `Location (${curLat.toFixed(4)}, ${curLng.toFixed(4)})`;
            setQuery(fallbackAddr);
            if (onChange) {
              onChange({
                address: fallbackAddr,
                city: '',
                state: '',
                pincode: '',
                coordinates: [curLng, curLat]
              });
            }
          }
        } catch (e) {
          console.error('GPS reverse geocode error:', e);
          const fallbackAddr = `Location (${curLat.toFixed(4)}, ${curLng.toFixed(4)})`;
          setQuery(fallbackAddr);
          if (onChange) {
            onChange({
              address: fallbackAddr,
              city: '',
              state: '',
              pincode: '',
              coordinates: [curLng, curLat]
            });
          }
        } finally {
          setDetectingGps(false);
          setTimeout(() => setFeedback(''), 4000);
        }
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        setDetectingGps(false);
        setFeedback('Could not fetch GPS location. Please search manually.');
        setTimeout(() => setFeedback(''), 4000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Direct manual edit
  const handleInputChange = (e) => {
    const val = e.target.value;
    isTypingRef.current = true;
    setQuery(val);
    if (onChange) {
      onChange({
        address: val,
        city: '',
        state: '',
        pincode: '',
        coordinates: [0, 0]
      });
    }
  };

  const handleClear = () => {
    isTypingRef.current = false;
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    if (onChange) {
      onChange({
        address: '',
        city: '',
        state: '',
        pincode: '',
        coordinates: [0, 0]
      });
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative w-full" ref={dropdownRef}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Main single address input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              required={required}
              value={query}
              onChange={handleInputChange}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowDropdown(true);
                } else if ((query || '').trim().length >= 2) {
                  isTypingRef.current = true;
                  setQuery((prev) => prev);
                }
              }}
              placeholder={placeholder}
              maxLength={300}
              className="w-full h-11 pl-10 pr-9 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/70 focus:bg-white transition-all shadow-sm font-medium text-slate-800 placeholder:text-slate-400"
            />

            {loadingSuggestions && (
              <Loader2 className="w-4 h-4 text-teal-600 animate-spin absolute right-3 top-3.5 pointer-events-none" />
            )}

            {!loadingSuggestions && query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                aria-label="Clear location input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* GPS Button: Only rendered when allowGps is true */}
          {allowGps && (
            <button
              type="button"
              onClick={handleGpsDetect}
              disabled={detectingGps}
              className="h-11 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 transition-colors flex items-center justify-center gap-2 flex-shrink-0 shadow-sm"
              title="Auto-fetch current GPS coordinates"
            >
              {detectingGps ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-teal-700" />
                  <span>Use GPS</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Full-width suggestions dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-60 overflow-y-auto overscroll-contain divide-y divide-slate-100 ring-1 ring-black/5 animate-in fade-in duration-100">
            <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 sticky top-0 z-10">
              <span>Select Address Suggestion</span>
              <span className="text-[10px] text-teal-700 font-semibold">{suggestions.length} places</span>
            </div>

            {suggestions.map((item, idx) => {
              const primary = item.mainText || item.name || '';
              const secondary = item.secondaryText || item.fullAddress || '';
              return (
                <button
                  key={`${item.lat || 0}-${item.lon || 0}-${idx}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(item);
                  }}
                  className="w-full text-left p-3 hover:bg-teal-50/80 transition-colors flex items-start gap-2.5 group cursor-pointer"
                >
                  <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg group-hover:bg-teal-100 group-hover:scale-105 transition-all flex-shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-teal-900 leading-snug truncate">
                      {primary}
                    </div>
                    {secondary && (
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-normal">
                        {secondary}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {feedback && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mt-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span className="truncate">{feedback}</span>
        </div>
      )}

      {helperText && !feedback && (
        <p className="text-[11px] text-slate-500 font-medium">{helperText}</p>
      )}
    </div>
  );
}
