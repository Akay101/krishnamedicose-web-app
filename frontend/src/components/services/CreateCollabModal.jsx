import React, { useState } from 'react';
import { X, Stethoscope, MapPin, Clock, Calendar, CheckSquare, Loader2, AlertCircle } from 'lucide-react';
import servicesApi from '../../utils/servicesApi';
import LocationPicker from './LocationPicker';

const COMMON_FACILITIES = [
  'Air-conditioned Doctor Consultation Chamber',
  'Patient Waiting Area with Seating',
  'Examination Couch & Privacy Screen',
  'Fully Stocked Attached Pharmacy',
  'Receptionist & Patient Appointment Management',
  'Digital BP, Pulse Oximeter, Weight Scale',
  'Wheelchair Accessible Ground Floor',
  'Doctor Car Parking Space'
];

export default function CreateCollabModal({ isOpen, onClose, onCollabCreated, initialCollab = null, userLocation = null, t = {}, lang }) {
  const [formData, setFormData] = useState({
    pharmacyName: initialCollab?.pharmacyName || '',
    clinicOrChamberName: initialCollab?.clinicOrChamberName || '',
    specializationNeeded: initialCollab?.specializationNeeded || 'General Physician',
    preferredTimings: initialCollab?.preferredTimings || 'Evening 5:30 PM - 8:30 PM',
    consultationDays: initialCollab?.consultationDays || 'Monday to Saturday',
    collaborationTerms: initialCollab?.collaborationTerms || '70% Doctor / 30% Chamber Share (Negotiable)',
    chamberFacilities: initialCollab?.chamberFacilities || [
      'Air-conditioned Doctor Consultation Chamber',
      'Patient Waiting Area with Seating',
      'Fully Stocked Attached Pharmacy'
    ],
    description: initialCollab?.description || '',
    visibilityRadiusKm: initialCollab?.visibilityRadiusKm || 30,
    address: initialCollab?.location?.address || userLocation?.address || '',
    city: initialCollab?.location?.city || userLocation?.city || '',
    state: initialCollab?.location?.state || userLocation?.state || '',
    pincode: initialCollab?.location?.pincode || userLocation?.pincode || '',
    coordinates: initialCollab?.location?.coordinates || userLocation?.coordinates || [77.1025, 28.7041]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleFacility = (facility) => {
    setFormData((prev) => {
      const exists = prev.chamberFacilities.includes(facility);
      return {
        ...prev,
        chamberFacilities: exists
          ? prev.chamberFacilities.filter((f) => f !== facility)
          : [...prev.chamberFacilities, facility]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        pharmacyName: formData.pharmacyName,
        clinicOrChamberName: formData.clinicOrChamberName,
        specializationNeeded: formData.specializationNeeded,
        preferredTimings: formData.preferredTimings,
        consultationDays: formData.consultationDays,
        collaborationTerms: formData.collaborationTerms,
        chamberFacilities: formData.chamberFacilities,
        description: formData.description,
        visibilityRadiusKm: Number(formData.visibilityRadiusKm),
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          coordinates: formData.coordinates
        }
      };

      let res;
      if (initialCollab?._id) {
        res = await servicesApi.put(`/collab-posts/${initialCollab._id}`, payload);
      } else {
        res = await servicesApi.post('/collab-posts', payload);
      }

      if (onCollabCreated) onCollabCreated(res.data.post);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save doctor collaboration listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-slate-900 px-6 sm:px-8 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <Stethoscope className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-outfit">
                {initialCollab ? 'Edit Doctor Collaboration Listing' : 'New Doctor Collaboration Listing'}
              </h3>
              <p className="text-xs text-emerald-100">
                Connect with registered doctors to practice at your pharmacy or clinic chamber
              </p>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinic / Chamber Name</label>
                <input
                  type="text"
                  value={formData.clinicOrChamberName}
                  onChange={(e) => setFormData({ ...formData, clinicOrChamberName: e.target.value })}
                  placeholder="e.g. Krishna Health Chamber"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Specialization Needed *</label>
                <input
                  type="text"
                  required
                  value={formData.specializationNeeded}
                  onChange={(e) => setFormData({ ...formData, specializationNeeded: e.target.value })}
                  placeholder="e.g. General Physician, Pediatrician, Gynecologist"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Timings *</label>
                <input
                  type="text"
                  required
                  value={formData.preferredTimings}
                  onChange={(e) => setFormData({ ...formData, preferredTimings: e.target.value })}
                  placeholder="e.g. Evening 5:00 PM - 8:30 PM"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Days *</label>
                <input
                  type="text"
                  required
                  value={formData.consultationDays}
                  onChange={(e) => setFormData({ ...formData, consultationDays: e.target.value })}
                  placeholder="e.g. Monday to Saturday or Alternate Days"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Collaboration Terms *</label>
              <input
                type="text"
                required
                value={formData.collaborationTerms}
                onChange={(e) => setFormData({ ...formData, collaborationTerms: e.target.value })}
                placeholder="e.g. 70-30 Percentage Share / Monthly Chamber Rent / Fixed Patient Fee"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Chamber Facilities Checklist */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Available Chamber Amenities</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMMON_FACILITIES.map((facility) => {
                  const isChecked = formData.chamberFacilities.includes(facility);
                  return (
                    <button
                      key={facility}
                      type="button"
                      onClick={() => toggleFacility(facility)}
                      className={`text-left p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isChecked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <CheckSquare className="w-3.5 h-3.5" />}
                      </div>
                      <span className="truncate">{facility}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description & Local Demographics *</label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your location footfall, patient demographics in the neighborhood, chamber setup, and welcome note to doctors."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Visibility Radius Slider */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Location & Proximity Radius
            </h4>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900">
                  Doctor Outreach Radius in Kilometers
                </span>
                <span className="text-sm font-extrabold text-emerald-700 px-3 py-1 bg-white rounded-lg border border-emerald-200">
                  {formData.visibilityRadiusKm} km
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={formData.visibilityRadiusKm}
                onChange={(e) => setFormData({ ...formData, visibilityRadiusKm: e.target.value })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-emerald-800 font-semibold mt-1">
                <span>5 km</span>
                <span>25 km</span>
                <span>50 km</span>
                <span>100 km</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                This collaboration post will be displayed to doctors registered within {formData.visibilityRadiusKm} km of your facility.
              </p>
            </div>

            <LocationPicker
              value={{
                address: formData.address,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                coordinates: formData.coordinates
              }}
              onChange={(newLoc) =>
                setFormData((prev) => ({
                  ...prev,
                  address: newLoc.address,
                  city: newLoc.city,
                  state: newLoc.state,
                  pincode: newLoc.pincode,
                  coordinates: newLoc.coordinates
                }))
              }
              t={t}
              lang={lang}
              showMapPreview={true}
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-700/20 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : initialCollab ? (
                'Update Collaboration Post'
              ) : (
                'Publish Collaboration Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
