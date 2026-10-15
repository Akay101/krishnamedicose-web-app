import React, { useState } from 'react';
import { X, Send, Briefcase, Building2, User, Phone, Mail, Award, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import servicesApi from '../../utils/servicesApi';

export default function ApplyJobModal({ isOpen, onClose, job, user, onApplicationSuccess }) {
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [qualification, setQualification] = useState(user?.pharmacistDetails?.qualification || 'B.Pharm');
  const [experienceYears, setExperienceYears] = useState(user?.pharmacistDetails?.experienceYears || 2);
  const [coverNote, setCoverNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await servicesApi.post(`/jobs/${job._id}/apply`, {
        mobile,
        qualification,
        experienceYears,
        coverNote
      });

      setSuccess(true);
      setTimeout(() => {
        if (onApplicationSuccess) onApplicationSuccess(job._id);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-slate-900 px-6 sm:px-8 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <Send className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-outfit">Apply for Pharmacist Position</h3>
              <p className="text-xs text-teal-100">{job.pharmacyName}</p>
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
        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Application Submitted</h4>
            <p className="text-sm text-slate-500">
              Your professional credentials and contact details have been sent to {job.pharmacyName}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Target Job Summary Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <h4 className="font-bold text-slate-900 text-sm">{job.title}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {job.pharmacyName} - {job.location?.city || 'Local Area'}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-teal-100 text-teal-800 rounded">
                  {job.jobType}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                  {job.salaryRange}
                </span>
              </div>
            </div>

            {/* Applicant Details Confirmation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.name || ''}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-100 text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Degree / Qualification *</label>
                <select
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                >
                  <option value="D.Pharm">D.Pharm</option>
                  <option value="B.Pharm">B.Pharm</option>
                  <option value="M.Pharm">M.Pharm</option>
                  <option value="Pharm.D">Pharm.D</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Experience in Years *</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  required
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Brief Introduction / Cover Message
              </label>
              <textarea
                rows={3}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Mention your availability to join, previous pharmacy experience, or dispensing skills..."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
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
                    Submitting...
                  </>
                ) : (
                  'Send Application'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
