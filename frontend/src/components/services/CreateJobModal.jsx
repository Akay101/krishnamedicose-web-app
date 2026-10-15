import React, { useState } from 'react';
import { X, Briefcase, MapPin, DollarSign, Clock, Users, FileText, Loader2, AlertCircle } from 'lucide-react';
import servicesApi from '../../utils/servicesApi';
import LocationPicker from './LocationPicker';

export default function CreateJobModal({ isOpen, onClose, onJobCreated, initialJob = null, userLocation = null, t = {}, lang }) {
  const [formData, setFormData] = useState({
    title: initialJob?.title || '',
    jobType: initialJob?.jobType || 'Full-time',
    requiredExperience: initialJob?.requiredExperience || '1 - 2 Years',
    requiredQualification: initialJob?.requiredQualification || 'B.Pharm',
    salaryRange: initialJob?.salaryRange || 'Rs. 25,000 - 35,000 / month',
    workTimings: initialJob?.workTimings || '9:00 AM - 6:00 PM (Monday to Saturday)',
    vacancies: initialJob?.vacancies || 1,
    description: initialJob?.description || '',
    requirements: initialJob?.requirements?.join('\n') || 'Dispensing medicines accurately\nInventory and stock management\nCustomer consultation and prescription validation',
    visibilityRadiusKm: initialJob?.visibilityRadiusKm || 25,
    address: initialJob?.location?.address || userLocation?.address || '',
    city: initialJob?.location?.city || userLocation?.city || '',
    state: initialJob?.location?.state || userLocation?.state || '',
    pincode: initialJob?.location?.pincode || userLocation?.pincode || '',
    coordinates: initialJob?.location?.coordinates || userLocation?.coordinates || [77.1025, 28.7041]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        jobType: formData.jobType,
        requiredExperience: formData.requiredExperience,
        requiredQualification: formData.requiredQualification,
        salaryRange: formData.salaryRange,
        workTimings: formData.workTimings,
        vacancies: Number(formData.vacancies),
        description: formData.description,
        requirements: formData.requirements.split('\n').filter((r) => r.trim().length > 0),
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
      if (initialJob?._id) {
        res = await servicesApi.put(`/jobs/${initialJob._id}`, payload);
      } else {
        res = await servicesApi.post('/jobs', payload);
      }

      if (onJobCreated) onJobCreated(res.data.job);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save job posting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-slate-900 px-6 sm:px-8 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <Briefcase className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-outfit">
                {initialJob ? 'Edit Pharmacist Job Vacancy' : 'Create Pharmacist Job Vacancy'}
              </h3>
              <p className="text-xs text-teal-100">
                Publish a certified vacancy for pharmacists in your operational radius
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

          {/* Job Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Job Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Retail Pharmacist / Senior Dispensing Pharmacist"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type *</label>
                <select
                  value={formData.jobType}
                  onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Locum / Relief">Locum / Relief</option>
                  <option value="Night Shift">Night Shift</option>
                  <option value="Weekend Shift">Weekend Shift</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Required Degree *</label>
                <select
                  value={formData.requiredQualification}
                  onChange={(e) => setFormData({ ...formData, requiredQualification: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                >
                  <option value="D.Pharm">D.Pharm</option>
                  <option value="B.Pharm">B.Pharm</option>
                  <option value="M.Pharm">M.Pharm</option>
                  <option value="Pharm.D">Pharm.D</option>
                  <option value="Any Pharmacy Degree">Any Pharmacy Degree</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Experience Level *</label>
                <select
                  value={formData.requiredExperience}
                  onChange={(e) => setFormData({ ...formData, requiredExperience: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                >
                  <option value="Fresher">Fresher (0 - 1 year)</option>
                  <option value="1 - 2 Years">1 - 2 Years</option>
                  <option value="2 - 5 Years">2 - 5 Years</option>
                  <option value="5+ Years">5+ Years</option>
                  <option value="Any Experience">Any Experience</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Salary / Compensation *</label>
                <input
                  type="text"
                  required
                  value={formData.salaryRange}
                  onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                  placeholder="e.g. Rs. 25,000 - 32,000 / month"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Timings *</label>
                <input
                  type="text"
                  required
                  value={formData.workTimings}
                  onChange={(e) => setFormData({ ...formData, workTimings: e.target.value })}
                  placeholder="e.g. 10:00 AM - 7:00 PM"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Number of Vacancies *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={formData.vacancies}
                  onChange={(e) => setFormData({ ...formData, vacancies: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Job Description *</label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe daily duties, pharmacy environment, software used, etc."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Key Requirements & Responsibilities (one per line)
              </label>
              <textarea
                rows={3}
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="Valid State Pharmacy Council License&#10;Computer billing experience&#10;Polite customer communication"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {/* Location & Visibility Radius */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Location & Radius Visibility
            </h4>

            {/* Radius Slider */}
            <div className="p-4 bg-teal-50/60 border border-teal-200/80 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-teal-900">
                  Target Visibility Radius in Kilometers
                </span>
                <span className="text-sm font-extrabold text-teal-700 px-3 py-1 bg-white rounded-lg border border-teal-200">
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
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-teal-800 font-semibold mt-1">
                <span>5 km (Local vicinity)</span>
                <span>25 km (City zone)</span>
                <span>50 km</span>
                <span>100 km (Regional)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                This job posting will be highlighted to pharmacists residing within {formData.visibilityRadiusKm} km of your pharmacy.
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

          {/* Action buttons */}
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
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-700/20 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : initialJob ? (
                'Update Job Vacancy'
              ) : (
                'Post Job Vacancy'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
