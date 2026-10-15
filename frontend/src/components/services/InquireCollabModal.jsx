import React, { useState } from 'react';
import { X, Send, Stethoscope, Building2, User, Phone, Mail, Clock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import servicesApi from '../../utils/servicesApi';

export default function InquireCollabModal({ isOpen, onClose, collabPost, user, onInquirySuccess }) {
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [specialization, setSpecialization] = useState(user?.doctorDetails?.specialization || 'General Physician');
  const [proposedTimings, setProposedTimings] = useState(collabPost?.preferredTimings || 'Evening 6:00 PM - 8:30 PM');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !collabPost) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await servicesApi.post(`/collab-posts/${collabPost._id}/inquire`, {
        mobile,
        specialization,
        proposedTimings,
        message
      });

      setSuccess(true);
      setTimeout(() => {
        if (onInquirySuccess) onInquirySuccess(collabPost._id);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit proposal.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-slate-900 px-6 sm:px-8 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <Stethoscope className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-outfit">Submit Collaboration Proposal</h3>
              <p className="text-xs text-emerald-100">{collabPost.pharmacyName}</p>
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
            <h4 className="text-xl font-bold text-slate-900">Proposal Dispatched</h4>
            <p className="text-sm text-slate-500">
              The pharmacy and clinic administrator has received your collaboration inquiry.
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

            {/* Target Collab Summary Box */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl">
              <h4 className="font-bold text-slate-900 text-sm">{collabPost.pharmacyName}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Specialization Requested: <strong>{collabPost.specializationNeeded}</strong>
              </p>
              <p className="text-xs text-emerald-800 font-semibold mt-1">
                Terms: {collabPost.collaborationTerms}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name</label>
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
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Specialization *</label>
                <input
                  type="text"
                  required
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Proposed Timings *</label>
                <input
                  type="text"
                  required
                  value={proposedTimings}
                  onChange={(e) => setProposedTimings(e.target.value)}
                  placeholder="e.g. 5:30 PM - 8:00 PM, Mon-Fri"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Proposal Message / Consultation Terms Discussion
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mention your preferred consultation fees, days of availability, or requirements..."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
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
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-700/20 transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Express Interest'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
