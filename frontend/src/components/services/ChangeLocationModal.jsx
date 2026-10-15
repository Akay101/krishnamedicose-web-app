import React, { useState } from 'react';
import { X, MapPin, Loader2, AlertCircle } from 'lucide-react';
import servicesApi from '../../utils/servicesApi';
import LocationPicker from './LocationPicker';

export default function ChangeLocationModal({ isOpen, onClose, currentLocation, onLocationUpdated, t = {}, lang }) {
  const [locationData, setLocationData] = useState({
    address: currentLocation?.address || '',
    city: currentLocation?.city || '',
    state: currentLocation?.state || '',
    pincode: currentLocation?.pincode || '',
    coordinates: currentLocation?.coordinates || [77.1025, 28.7041]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!locationData.city || !locationData.address) {
      setError(t.errRequired || 'Please provide both address and city.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await servicesApi.put('/auth/profile', {
        location: locationData
      });

      if (onLocationUpdated) {
        onLocationUpdated(res.data.user?.location || locationData);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        <div className="bg-gradient-to-r from-teal-700 to-slate-900 px-6 sm:px-8 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <MapPin className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-outfit">{t.changeLocation || 'Update Your Location'}</h3>
              <p className="text-xs text-teal-100">Set accurate location for nearby job matches and doctor connections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <LocationPicker
            value={locationData}
            onChange={(newLoc) => setLocationData(newLoc)}
            t={t}
            lang={lang}
            showMapPreview={true}
          />

          <div className="pt-5 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save New Location</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
